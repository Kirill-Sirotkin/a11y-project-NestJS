import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JwtPayloadDto } from 'src/modules/auth/dto/jwt-payload.dto';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor() {
    const jwtSecret = process.env.JWT_REFRESH_SECRET;
    if (jwtSecret === undefined) {
        throw new Error('JWT_REFRESH_SECRET is not defined in the environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }
  
  async validate(payload: JwtPayloadDto): Promise<JwtPayloadDto> {
    return payload;
  }
}