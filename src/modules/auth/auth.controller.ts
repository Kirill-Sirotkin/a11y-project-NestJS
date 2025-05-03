import { Request, Controller, Post, UseGuards, HttpStatus, HttpCode, Get, Delete, Response } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenPairDto } from './dto/token-pair.dto';
import { AccessTokenDto } from './dto/access-token.dto';
import { LocalAuthGuard } from 'src/guards/local-auth.guard';
import { JwtAccessAuthGuard } from 'src/guards/jwt-access-auth.guard';
import { JwtRefreshAuthGuard } from 'src/guards/jwt-refresh-auth.guard';
import { GoogleAuthGuard } from 'src/guards/google-auth.guard';
import { Public } from 'src/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
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
    const accessToken = await this.authService.generateAccessToken(req.user);
    await this.authService.overrideAccessToken(req.user.id, accessToken.accessToken);
    return accessToken
  }

  @UseGuards(JwtAccessAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('logout')
  async logout(@Request() req): Promise<void> {
    await this.authService.deleteSession(req.user.sub);
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
