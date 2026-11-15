import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticationDto } from './dto/auth-request.dto';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReqUserId } from '../../common/decorators/request-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() data: AuthenticationDto, @Res({ passthrough: true }) res: Response) {
    const authPath = process.env.NODE_ENV === 'production' ? '/auth' : '/api/auth';
    res.clearCookie('access_token', {
      path: '/',
    });
    res.clearCookie('refresh_token', {
      path: authPath,
    });

    const { accessToken, refreshToken } = await this.authService.login(data);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Number(process.env.JWT_ACCESS_EXP) * 1000,
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Number(process.env.JWT_REFRESH_EXP) * 1000,
      path: authPath,
    });

    return {
      success: true,
    };
  }

  @Post('register')
  async register(@Body() data: AuthenticationDto, @Res({ passthrough: true }) res: Response) {
    const authPath = process.env.NODE_ENV === 'production' ? '/auth' : '/api/auth';
    res.clearCookie('access_token', {
      path: '/',
    });
    res.clearCookie('refresh_token', {
      path: authPath,
    });

    const { accessToken, refreshToken } = await this.authService.register(data);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Number(process.env.JWT_ACCESS_EXP) * 1000,
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Number(process.env.JWT_REFRESH_EXP) * 1000,
      path: authPath,
    });

    return {
      success: true,
    };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const initialRefreshToken = req.cookies?.refresh_token;

    await this.authService.logout(initialRefreshToken);

    const authPath = process.env.NODE_ENV === 'production' ? '/auth' : '/api/auth';
    res.clearCookie('access_token', {
      path: '/',
    });
    res.clearCookie('refresh_token', {
      path: authPath,
    });

    return {
      success: true,
    };
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const authPath = process.env.NODE_ENV === 'production' ? '/auth' : '/api/auth';
    const initialRefreshToken = req.cookies?.refresh_token;

    if (!initialRefreshToken) {
      throw new UnauthorizedException('Session expired');
    }

    const { accessToken, refreshToken } = await this.authService.refresh(initialRefreshToken);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Number(process.env.JWT_ACCESS_EXP) * 1000,
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Number(process.env.JWT_REFRESH_EXP) * 1000,
      path: authPath,
    });

    return {
      success: true,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async profile(@ReqUserId() userId: string) {
    return this.authService.profile(userId);
  }
}
