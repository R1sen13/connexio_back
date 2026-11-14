import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Module } from '@nestjs/common';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}