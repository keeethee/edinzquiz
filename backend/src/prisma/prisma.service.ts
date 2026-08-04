import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Prisma successfully connected to Database.');
    } catch (err) {
      console.error('Prisma DB Connection Warning:', err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
