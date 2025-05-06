import { Request, Controller, Post, UseGuards, HttpStatus, HttpCode, Get, Delete, Response, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenPairDto } from './dto/token-pair.dto';
import { AccessTokenDto } from './dto/access-token.dto';
import { LocalAuthGuard } from 'src/guards/local-auth.guard';
import { JwtAccessAuthGuard } from 'src/guards/jwt-access-auth.guard';
import { JwtRefreshAuthGuard } from 'src/guards/jwt-refresh-auth.guard';
import { GoogleAuthGuard } from 'src/guards/google-auth.guard';
import { Public } from 'src/decorators/public.decorator';
import { RegisterDataDto } from './dto/register-data.dto';
import { UserDataDto } from './dto/user-data.dto';
import { JwtVerifyAuthGuard } from 'src/guards/jwt-verify-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @Public()
  @Post('register')
  async register(@Body() data: RegisterDataDto): Promise<TokenPairDto> {
    const user = await this.authService.registerLocalUser(data);
    const tokenPair = await this.authService.generateTokenPair(user);
    await this.authService.overrideSession(user.id, tokenPair.accessToken, tokenPair.refreshToken);
    return tokenPair
  }

  @Public()
  @UseGuards(JwtVerifyAuthGuard)
  @Get('verify')
  async verify(@Request() req): Promise<boolean> {
    console.log(`req user: ${JSON.stringify(req.user)}`)
    await this.authService.confirmEmailVerification(req.user.sub);
    return true
  }

  @Get('verify/new-link')
  async resendVerification(@Request() req): Promise<boolean> {
    console.log(`req user: ${JSON.stringify(req.user)}`)
    const token = await this.authService.generateVerifyToken(req.user.sub);
    await this.authService.resendEmailVerification(req.user.sub, token.verifyToken);
    return true
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Request() req): Promise<TokenPairDto> {
    const tokenPair = await this.authService.generateTokenPair(req.user);
    await this.authService.overrideSession(req.user.id, tokenPair.accessToken, tokenPair.refreshToken);
    return tokenPair
  }

  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Request() req): Promise<AccessTokenDto> {
    const tokenPair = await this.authService.generateTokenPair(req.user);
    await this.authService.overrideSession(req.user.id, tokenPair.accessToken, tokenPair.refreshToken);
    return tokenPair
  }

  @HttpCode(HttpStatus.OK)
  @Delete('logout')
  async logout(@Request() req): Promise<boolean> {
    await this.authService.deleteSession(req.user.sub);
    return true
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleAuth(): Promise<void> {}

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Request() req, @Response() res): Promise<void> {
    const tokenPair = await this.authService.generateTokenPair(req.user);
    console.log(`Google OAuth token pair: ${JSON.stringify(tokenPair)}`)
    await this.authService.overrideSession(req.user.id, tokenPair.accessToken, tokenPair.refreshToken);
    // redirect to frontend with token in query params
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?accessToken=${tokenPair.accessToken}&refreshToken=${tokenPair.refreshToken}`);
  }
}
