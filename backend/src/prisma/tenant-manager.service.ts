import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class TenantManagerService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantManagerService.name);
  private tenantClients = new Map<string, PrismaClient>();
  private provisionedSchemas = new Set<string>();

  /**
   * Helper to format a safe PostgreSQL schema name from a student UUID.
   */
  getSchemaName(studentId: string): string {
    const cleanId = studentId.replace(/[^a-zA-Z0-9]/g, '_');
    return `student_${cleanId}`;
  }

  /**
   * Provisions PostgreSQL schema for the given student if not already present.
   */
  async ensureStudentSchema(mainPrisma: PrismaClient, studentId: string): Promise<string> {
    const schemaName = this.getSchemaName(studentId);
    if (this.provisionedSchemas.has(schemaName)) {
      return schemaName;
    }

    try {
      // 1. Create PostgreSQL isolated schema if not existing
      await mainPrisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);

      // 2. Clone essential student tables into isolated schema if needed
      await mainPrisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."quiz_submissions" (LIKE public.quiz_submissions INCLUDING ALL);
        CREATE TABLE IF NOT EXISTS "${schemaName}"."student_answers" (LIKE public.student_answers INCLUDING ALL);
        CREATE TABLE IF NOT EXISTS "${schemaName}"."assignment_submissions" (LIKE public.assignment_submissions INCLUDING ALL);
        CREATE TABLE IF NOT EXISTS "${schemaName}"."assignment_ai_evaluations" (LIKE public.assignment_ai_evaluations INCLUDING ALL);
      `);

      this.provisionedSchemas.add(schemaName);
      this.logger.log(`Provisioned isolated database schema "${schemaName}" for student ${studentId}`);
    } catch (err) {
      this.logger.error(`Error provisioning schema "${schemaName}": ${err.message}`);
    }

    return schemaName;
  }

  /**
   * Gets or instantiates a cached PrismaClient for the given student's schema.
   */
  async getTenantClient(mainPrisma: PrismaClient, studentId: string): Promise<PrismaClient> {
    const schemaName = await this.ensureStudentSchema(mainPrisma, studentId);
    
    if (this.tenantClients.has(studentId)) {
      return this.tenantClients.get(studentId)!;
    }

    const mainDbUrl = process.env.DATABASE_URL || '';
    let tenantUrl = mainDbUrl;
    try {
      if (mainDbUrl.startsWith('postgresql://') || mainDbUrl.startsWith('postgres://')) {
        const urlObj = new URL(mainDbUrl);
        urlObj.searchParams.set('schema', schemaName);
        tenantUrl = urlObj.toString();
      }
    } catch {
      tenantUrl = mainDbUrl;
    }

    const tenantClient = new PrismaClient({
      datasources: {
        db: {
          url: tenantUrl,
        },
      },
    });

    await tenantClient.$connect();
    this.tenantClients.set(studentId, tenantClient);
    return tenantClient;
  }

  async onModuleDestroy() {
    for (const [studentId, client] of this.tenantClients.entries()) {
      try {
        await client.$disconnect();
      } catch (err) {
        this.logger.error(`Error disconnecting tenant client for ${studentId}: ${err.message}`);
      }
    }
    this.tenantClients.clear();
  }
}
