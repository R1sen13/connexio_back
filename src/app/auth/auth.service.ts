import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../infrastracture/prisma/prisma.service';
import { RedisService } from '../../infrastracture/redis/redis.service';
import { AuthenticationDto } from './dto/auth-request.dto';
import { JwtService } from '@nestjs/jwt';
import { hashData, verifyData } from '../../common/helpers/hash-verify.helper';
import { createHash, randomUUID } from 'node:crypto';
import { ProfileResponse } from './dto/auth-response.dto';
import { RefreshPayload } from '../../common/types/token-payload.type';

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
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!(await verifyData(user.passwordHash, password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.debug(`User ${user.id} has logged in`);

    return this.createAuthSession(user.id);
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

    return this.createAuthSession(user.id);
  }

  async refresh(refreshToken: string) {
    const redis = this.redisService.getClient();
    let payload: RefreshPayload;

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (!payload.sub || !payload.sid) {
        throw new UnauthorizedException('Invalid refresh token');
      }
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const sessionKey = `auth:session:${payload.sid}`;

    const session = await redis.hGetAll(sessionKey);

    if (Object.keys(session).length === 0) {
      throw new UnauthorizedException('Session expired');
    }

    if (session.userId !== payload.sub) {
      throw new UnauthorizedException('Invalid session');
    }

    const receivedTokenHash = createHash('sha256').update(refreshToken).digest('hex');

    if (receivedTokenHash !== session.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.createAuthSession(payload.sub);

    await redis.del(sessionKey);

    return tokens;
  }

  async logout(refreshToken: string) {
    const redis = this.redisService.getClient();
    let payload: RefreshPayload;

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      if (payload.type !== 'refresh') {
        return;
      }

      if (!payload.sub || !payload.sid) {
        return;
      }
    } catch {
      return;
    }

    const sessionKey = `auth:session:${payload.sid}`;

    const session = await redis.hGetAll(sessionKey);

    if (Object.keys(session).length === 0) {
      return;
    }

    if (session.userId !== payload.sub) {
      return;
    }

    await redis.del(sessionKey);
  }

  async profile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User is not authorized');
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

  private async createAuthSession(userId: string) {
    const sessionId = randomUUID();

    const tokens = await this.generateTokens(userId, sessionId);

    await this.createRedisSession(userId, sessionId, tokens.refreshToken);

    return tokens;
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
