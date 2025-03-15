import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthAlphaService } from './auth-alpha.service';
import { AuthAlphaDto } from './dto/auth-alpha.dto';
import { AuthLoginService } from 'src/guards/auth-login/auth-login.service';
import { AuthService } from '../auth/auth.service';

@Controller('auth-alpha')
export class AuthAlphaController {
  constructor(
    private readonly authAlphaService: AuthAlphaService, 
    private readonly authService: AuthService) {}
  
  @Post('register')
  async register(@Body() data: AuthAlphaDto) {
    return await this.authAlphaService.register(data);
  }

  @Post('login')
  @UseGuards(AuthLoginService)
  async login(@Body() { email }: AuthAlphaDto) {
    return await this.authService.login(email);
  }
}
