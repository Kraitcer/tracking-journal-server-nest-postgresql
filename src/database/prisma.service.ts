import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { appConfig } from '../config.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    if (
      !Number.isInteger(appConfig.databasePoolMax) ||
      appConfig.databasePoolMax < 1
    ) {
      throw new Error('DATABASE_POOL_MAX must be a positive integer');
    }
    const adapter = new PrismaPg({
      connectionString: appConfig.databaseUrl,
      max: appConfig.databasePoolMax,
    });
    super({ adapter });
  }

  async onModuleInit() {
    if (!appConfig.databaseUrl) {
      throw new Error('DATABASE_URL must be configured');
    }
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
