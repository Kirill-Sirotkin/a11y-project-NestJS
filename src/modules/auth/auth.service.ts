import * as argon2 from 'argon2';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { LoginDataDto } from './dto/login-data.dto';
import { UserDataDto } from './dto/user-data.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { AccessTokenDto } from './dto/access-token.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly jwtService: JwtService,
    ) {}

    async validateUser(data: LoginDataDto): Promise<UserDataDto> {
        const user = await this.databaseService.getUserByEmail(data.email);
        if (!user) {
            throw new NotFoundException('user with provided email not found');
            // Also log this
        }

        const isPasswordValid = await argon2.verify(user.passwordHash, data.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('wrong password');
            // Also log this
        }

        const { passwordHash, ...userDto } = user;
        return userDto as UserDataDto
    }

    async generateTokenPair(userId: string): Promise<TokenPairDto> {
        const payload = { sub: userId }
        
        const { accessToken } = await this.generateAccessToken(userId)
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
            secret: process.env.JWT_REFRESH_SECRET,
        })

        return { accessToken, refreshToken }
    }

    async generateAccessToken(userId: string): Promise<AccessTokenDto> {
        const payload = { sub: userId }
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: process.env.JWT_EXPIRES_IN,
            secret: process.env.JWT_SECRET,
        })

        return { accessToken }
    }
}
