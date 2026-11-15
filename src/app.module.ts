import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from './app/health/health.module';
import { environmentConfig } from './config/environment.configuration';
import { PrismaModule } from './infrastracture/prisma/prisma.module';
import { RedisModule } from './infrastracture/redis/redis.module';
import { AuthModule } from './app/auth/auth.module';
import { SecurityModule } from './common/security/security.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: environmentConfig,
    }),
    PrismaModule,
    RedisModule,
    SecurityModule,
    HealthModule,
    AuthModule,
  ],
})
export class AppModule {}
