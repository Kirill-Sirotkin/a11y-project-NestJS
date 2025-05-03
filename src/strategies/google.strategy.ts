import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-google-oauth20";
import { AuthService } from "src/modules/auth/auth.service";
import { GoogleUserDataDto } from "src/modules/auth/dto/google-user-data.dto";
import { UserDataDto } from "src/modules/auth/dto/user-data.dto";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        const clientId = process.env.GOOGLE_OAUTH2_CLIENT_ID;
        if (clientId === undefined) {
            throw new Error('GOOGLE_OAUTH2_CLIENT_ID is not defined in the environment variables');
        }
        const clientSecret = process.env.GOOGLE_OAUTH2_CLIENT_SECRET;
        if (clientSecret === undefined) {
            throw new Error('GOOGLE_OAUTH2_CLIENT_SECRET is not defined in the environment variables');
        }
        const callbackUrl = process.env.GOOGLE_OAUTH2_CALLBACK_URL;
        if (callbackUrl === undefined) {
            throw new Error('GOOGLE_OAUTH2_CALLBACK_URL is not defined in the environment variables');
        }

        super({
            clientID: clientId,
            clientSecret: clientSecret,
            callbackURL: callbackUrl,
            scope: ["email", "profile"],
        });
    }

    async validate(
        accessToken: string, 
        refreshToken: string, 
        profile: GoogleUserDataDto
    ): Promise<UserDataDto> {
        return await this.authService.validateUserGoogle(profile);
    }
}