import { Request, Controller, Post, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from 'src/guards/local-auth.guard';
import { UserDataDto } from './dto/user-data.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
    async login(@Request() req): Promise<UserDataDto> {
      return req.user
  }
}
