import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastracture/prisma/prisma.service';
import { RedisService } from '../../infrastracture/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  login() {}

  register() {}

  profile() {}
}
