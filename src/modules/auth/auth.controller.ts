import { Request, Controller, Post, UseGuards, HttpStatus, HttpCode, Get, Delete, Response, Body, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenPairDto } from './dto/token-pair.dto';
import { AccessTokenDto } from '../token-generation/dto/access-token.dto';
import { LocalAuthGuard } from 'src/guards/local-auth.guard';
import { JwtRefreshAuthGuard } from 'src/guards/jwt-refresh-auth.guard';
import { GoogleAuthGuard } from 'src/guards/google-auth.guard';
import { Public } from 'src/decorators/public.decorator';
import { RegisterDataDto } from './dto/register-data.dto';
import { JwtVerifyAuthGuard } from 'src/guards/jwt-verify-auth.guard';
import { ResetPasswordDataDto } from './dto/reset-password-data.dto';
import { ResetPasswordEmailDataDto } from './dto/reset-password-email-data.dto';
import { JwtResetPasswordAuthGuard } from 'src/guards/jwt-reset-password-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @Public()
  @Post('register')
  async register(@Body() data: RegisterDataDto): Promise<TokenPairDto> {
    console.log(`register data: ${JSON.stringify(data)}`);
    return await this.authService.register(data)
  }

  @Public()
  @UseGuards(JwtVerifyAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('verify/callback')
  async verifyCallback(@Request() req): Promise<boolean> {
    console.log(`verify user: ${JSON.stringify(req.user)}`);
    return await this.authService.verify(req.user.sub)
  }

  @Get('verify/resend')
  async resendVerification(@Request() req): Promise<boolean> {
    console.log(`resendVerification user: ${JSON.stringify(req.user)}`);
    return await this.authService.resendVerification(req.user.sub)
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Request() req): Promise<TokenPairDto> {
    console.log(`login user: ${JSON.stringify(req.user)}`);
    return await this.authService.login(req.user.id)
  }

  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Request() req): Promise<AccessTokenDto> {
    console.log(`refresh user: ${JSON.stringify(req.user)}`);
    return await this.authService.refresh(req.user.sub)
  }

  @HttpCode(HttpStatus.OK)
  @Delete('logout')
  async logout(@Request() req): Promise<boolean> {
    console.log(`logout user: ${JSON.stringify(req.user)}`);
    return await this.authService.logout(req.user.sub)
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleAuth(): Promise<void> {}

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Request() req, @Response() res): Promise<void> {
    console.log(`googleCallback user: ${JSON.stringify(req.user)}`);
    const tokenPair = await this.authService.googleCallback(req.user.sub);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?accessToken=${tokenPair.accessToken}&refreshToken=${tokenPair.refreshToken}`);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('password/reset')
  async resetPassword(@Body() data: ResetPasswordEmailDataDto): Promise<boolean> {
    console.log(`reset password data: ${JSON.stringify(data)}`);
    return await this.authService.resetPassword(data.email)
  }

  @Public()
  @UseGuards(JwtResetPasswordAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('password/reset/callback')
  async resetPasswordCallback(@Request() req, @Body() data: ResetPasswordDataDto): Promise<boolean> {
    console.log(`reset password callback user: ${JSON.stringify(req.user)}`);
    return await this.authService.resetPasswordCallback(req.user.sub, data)
  }
}
