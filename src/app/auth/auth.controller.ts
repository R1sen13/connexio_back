import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticationDto } from './dto/auth-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() data: AuthenticationDto) {
    return this.authService.login(data);
  }

  @Post('register')
  register(@Body() data: AuthenticationDto) {
    return this.authService.register(data);
  }

  @Get('me')
  profile() {
    return this.authService.profile();
  }
}
