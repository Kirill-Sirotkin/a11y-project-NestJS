import { Strategy } from 'passport-local';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from 'src/modules/auth/auth.service';
import { UserDataDto } from 'src/modules/auth/dto/user-data.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super(
            { usernameField: 'email' },
        );
    }

    async validate(email: string, password: string): Promise<UserDataDto> {
        return this.authService.validateUser({ email, password })
    }
}