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
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthenticationDto } from './dto/auth-request.dto';
import { AuthSuccessResponse, ProfileResponse } from './dto/auth-response.dto';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReqUserId } from '../../common/decorators/request-user.decorator';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Вход в аккаунт',
    description:
      'Проверяет email и пароль, создаёт Redis-сессию и устанавливает access_token и refresh_token в httpOnly cookies.',
  })
  @ApiOkResponse({
    description: 'Пользователь успешно вошёл в аккаунт. Токены установлены в cookies.',
    type: AuthSuccessResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Неверный email или пароль.' })
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
  @ApiOperation({
    summary: 'Регистрация пользователя',
    description:
      'Создаёт пользователя, хэширует пароль, создаёт Redis-сессию и устанавливает токены в httpOnly cookies.',
  })
  @ApiOkResponse({
    description: 'Пользователь успешно зарегистрирован.',
    type: AuthSuccessResponse,
  })
  @ApiBadRequestResponse({ description: 'Некорректные данные или email уже занят.' })
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
  @ApiOperation({
    summary: 'Выход из аккаунта',
    description: 'Удаляет Redis-сессию и очищает access_token и refresh_token cookies.',
  })
  @ApiOkResponse({
    description: 'Сессия завершена, cookies очищены.',
    type: AuthSuccessResponse,
  })
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
  @ApiOperation({
    summary: 'Обновление токенов',
    description:
      'Проверяет refresh_token, Redis-сессию и выдаёт новую пару токенов с ротацией refresh-сессии.',
  })
  @ApiOkResponse({
    description: 'Токены успешно обновлены и установлены в cookies.',
    type: AuthSuccessResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Refresh token отсутствует, недействителен или истёк.' })
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
  @ApiCookieAuth('access_token')
  @ApiOperation({
    summary: 'Получить текущего пользователя',
    description: 'Возвращает профиль пользователя из access_token cookie.',
  })
  @ApiOkResponse({ description: 'Профиль пользователя.', type: ProfileResponse })
  @ApiUnauthorizedResponse({ description: 'Access token отсутствует, недействителен или истёк.' })
  async profile(@ReqUserId() userId: string) {
    return this.authService.profile(userId);
  }
}
