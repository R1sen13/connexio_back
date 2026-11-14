import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastracture/prisma/prisma.service';
import { RedisService } from '../../infrastracture/redis/redis.service';
import { AuthenticationDto } from './dto/auth-request.dto';
import { JwtService } from '@nestjs/jwt';
import { hashData } from '../../common/helpers/hash-verify.helper';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: AuthenticationDto) {
    const { email, password } = data;
  }

  async register(data: AuthenticationDto) {
    const { email, password } = data;

    const occupied = await this.prisma.user.findOne({ email });

    if (occupied) {
      throw new BadRequestException('Authentication error! Try again');
    }

    const hashedPassword = await hashData(data.password);

    const user = await this.prisma.user.create({
      email,
      password: hashedPassword,
    });

    //TODO Add JWT cookies
  }

  profile() {}
}
