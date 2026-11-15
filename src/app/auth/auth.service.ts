import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastracture/prisma/prisma.service';
import { RedisService } from '../../infrastracture/redis/redis.service';
import { AuthenticationDto } from './dto/auth-request.dto';
import { JwtService } from '@nestjs/jwt';
import { hashData, verifyData } from '../../common/helpers/hash-verify.helper';
import { createHash, randomUUID } from 'node:crypto';
import { ProfileResponse } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: AuthenticationDto) {
    const { email, password } = data;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Authentication error! Try again');
    }

    if (!(await verifyData(user.passwordHash, password))) {
      throw new BadRequestException('Authentication error! Try again');
    }

    this.logger.debug(`User ${user.id} has logged in`);

    const sessionId = await this.createSession();

    const { accessToken, refreshToken } = await this.generateTokens(user.id, sessionId);

    await this.createRedisSession(user.id, sessionId, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async register(data: AuthenticationDto) {
    const { email, password } = data;

    const occupied = await this.prisma.user.findUnique({
      where: { email },
    });

    if (occupied) {
      throw new BadRequestException('Authentication error! Try again');
    }

    const hashedPassword = await hashData(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
      },
    });

    this.logger.debug(`Registered user: ${user.id}`);

    const sessionId = await this.createSession();

    const { accessToken, refreshToken } = await this.generateTokens(user.id, sessionId);

    await this.createRedisSession(user.id, sessionId, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async profile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return new ProfileResponse(user);
  }

  async generateTokens(userId: string, sessionId: string) {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: userId,
        type: 'access',
      },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: Number(process.env.JWT_ACCESS_EXP),
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: userId,
        sid: sessionId,
        type: 'refresh',
      },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: Number(process.env.JWT_REFRESH_EXP),
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async createSession() {
    const sessionId: string = randomUUID();
    return sessionId;
  }

  async createRedisSession(userId: string, sessionId: string, refreshToken: string) {
    const redis = this.redisService.getClient();

    const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');

    const key = `auth:session:${sessionId}`;

    await redis
      .multi()
      .hSet(key, {
        userId,
        refreshTokenHash,
        createdAt: new Date().toISOString(),
      })
      .expire(key, Number(process.env.JWT_REFRESH_EXP))
      .exec();
  }
}
