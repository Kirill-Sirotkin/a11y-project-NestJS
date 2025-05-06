import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "src/modules/auth/auth.service";
import { JwtPayloadDto } from "src/modules/auth/dto/jwt-payload.dto";
import { JwtVerifyPayloadDto } from "src/modules/auth/dto/jwt-verify-payload.dto";

@Injectable()
export class JwtVerifyStrategy extends PassportStrategy(Strategy, "jwt-verify") {
  constructor(private readonly authService: AuthService) {
    const jwtSecret = process.env.JWT_VERIFY_SECRET;
    if (jwtSecret === undefined) {
        throw new Error('JWT_VERIFY_SECRET is not defined in the environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromUrlQueryParameter("verificationToken"),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      passReqToCallback: true,
    });
  }
  
  async validate(req: Request, payload: JwtVerifyPayloadDto): Promise<JwtVerifyPayloadDto> {
    const verifyToken = req.query.verificationToken as string;
    if (!verifyToken) {
      throw new UnauthorizedException('verify token not found in request query');
    }
    // console.log(`JWT Access Guard got access token: ${accessToken}`)

    await this.authService.validateUserJwtVerify(payload.sub, verifyToken)
    return payload;
  }
}