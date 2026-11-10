import { Module } from '@nestjs/common';
import { HealthModule } from './app/health/health.module';

@Module({
  imports: [HealthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
