import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TenantManagerService } from './tenant-manager.service';

@Global()
@Module({
  providers: [PrismaService, TenantManagerService],
  exports: [PrismaService, TenantManagerService],
})
export class PrismaModule {}
