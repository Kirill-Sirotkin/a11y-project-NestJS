import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { AuthLoginService } from 'src/guards/auth-login/auth-login.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() data: AuthDto) {
    return await this.authService.register(data);
  }

  @Post('login')
  @UseGuards(AuthLoginService)
  async login(@Body() { email }: AuthDto) {
    return await this.authService.login(email);
  }
}
