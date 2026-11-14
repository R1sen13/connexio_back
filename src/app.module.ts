import { Module } from '@nestjs/common';
import { HealthModule } from './app/health/health.module';
import { ConfigModule } from '@nestjs/config';
import { environmentConfig } from './config/environment.configuration';
import { PrismaModule } from './infrastracture/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: environmentConfig
    }),
    PrismaModule,
    HealthModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
