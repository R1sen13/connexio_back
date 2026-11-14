import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastracture/prisma/prisma.service';
import { RedisService } from '../../infrastracture/redis/redis.service';
import { AuthenticationDto } from './dto/auth-request.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  login(data: AuthenticationDto) {
    const { email, password } = data;
  }

  register(data: AuthenticationDto) {}

  profile() {}
}
