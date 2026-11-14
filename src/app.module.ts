import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from './app/health/health.module';
import { environmentConfig } from './config/environment.configuration';
import { PrismaModule } from './infrastracture/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: environmentConfig,
    }),
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
