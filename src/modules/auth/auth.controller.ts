import { Request, Controller, Post, UseGuards, HttpStatus, HttpCode, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from 'src/guards/local-auth.guard';
import { UserDataDto } from './dto/user-data.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { JwtAccessAuthGuard } from 'src/guards/jwt-access-auth.guard';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { AccessTokenDto } from './dto/access-token.dto';
import { JwtRefreshAuthGuard } from 'src/guards/jwt-refresh-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
    async login(@Request() req): Promise<TokenPairDto> {
      return await this.authService.generateTokenPair(req.user.id)
  }

  @UseGuards(JwtAccessAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('user')
    async getUserId(@Request() req): Promise<string> {
      console.log(req.user.sub)
      return "success"
  }

  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('refresh')
    async refresh(@Request() req): Promise<AccessTokenDto> {
      console.log(req.user.sub)
      console.log('refreshing token')
      return await this.authService.generateAccessToken(req.user.sub)
  }
}
