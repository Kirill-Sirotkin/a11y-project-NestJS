import * as argon2 from 'argon2';
import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { LoginDataDto } from './dto/login-data.dto';
import { UserDataDto } from './dto/user-data.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { AccessTokenDto } from './dto/access-token.dto';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { Session } from '@prisma/client';
import { GoogleUserDataDto } from './dto/google-user-data.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly jwtService: JwtService,
    ) {}

    async validateUserLocal(data: LoginDataDto): Promise<UserDataDto> {
        const user = await this.databaseService.getUserByEmail(data.email);
        if (!user) {
            throw new NotFoundException('user with provided email not found');
            // Also log this
        }

        if (user.isOAuth) {
            throw new UnauthorizedException('user registered with OAuth provider');
            // Also log this
        }

        if (!user.passwordHash) {
            throw new UnauthorizedException('user password not set');
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

    async validateUserJwtAccess(userId: string, accessToken: string): Promise<void> {
        const session = await this.databaseService.getSessionByUserId(userId)
        if (!session) {
            throw new NotFoundException('session not found');
        }

        const isAccessTokenValid = await argon2.verify(session.accessTokenHash, accessToken);
        if (!isAccessTokenValid) {
            throw new UnauthorizedException('access token is invalid');
        }
    }

    async validateUserJwtRefresh(userId: string, refreshToken: string): Promise<void> {
        const session = await this.databaseService.getSessionByUserId(userId)
        if (!session) {
            throw new NotFoundException('session not found');
        }

        const isRefreshTokenValid = await argon2.verify(session.refreshTokenHash, refreshToken);
        if (!isRefreshTokenValid) {
            throw new UnauthorizedException('refresh token is invalid');
        }
    }

    async validateUserGoogle(userGoogle: GoogleUserDataDto): Promise<UserDataDto> {
        const emailGoogle = userGoogle.emails[0].value
        if (!emailGoogle) {
            throw new InternalServerErrorException('email not provided by google OAuth');
        }

        const user = await this.databaseService.getUserByEmail(emailGoogle)
        if (user) {
            const { passwordHash, ...userDto } = user;
            return userDto as UserDataDto
        }

        const newUser = await this.databaseService.createUser(emailGoogle, null, true, true)
        const { passwordHash, ...userDto } = newUser;
        return userDto as UserDataDto
    }

    async generateTokenPair(user: UserDataDto): Promise<TokenPairDto> {
        const payload: JwtPayloadDto = {
            sub: user.id,
            role: user.role,
            isActive: user.isActive,
            isVerified: user.isVerified
        }
        
        const { accessToken } = await this.generateAccessToken(user)
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
            secret: process.env.JWT_REFRESH_SECRET,
        })

        return { accessToken, refreshToken }
    }

    async generateAccessToken(user: UserDataDto): Promise<AccessTokenDto> {
        const payload: JwtPayloadDto = {
            sub: user.id,
            role: user.role,
            isActive: user.isActive,
            isVerified: user.isVerified
        }

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: process.env.JWT_EXPIRES_IN,
            secret: process.env.JWT_SECRET,
        })

        return { accessToken }
    }

    async overrideSession(userId: string, accessToken: string, refreshToken: string): Promise<void> {
        try {
            const accessTokenHash = await argon2.hash(accessToken);
            const refreshTokenHash = await argon2.hash(refreshToken);
    
            await this.databaseService.overrideSession(userId, accessTokenHash, refreshTokenHash);
        } catch (error) {
            throw new InternalServerErrorException(`failed to override session: ${error}`)
        }
    }

    async overrideAccessToken(userId: string, accessToken: string): Promise<void> {
        try {
            const accessTokenHash = await argon2.hash(accessToken);
            await this.databaseService.overrideAccessToken(userId, accessTokenHash);
        } catch (error) {
            throw new InternalServerErrorException(`failed to override access token: ${error}`)
        }
    }

    async deleteSession(userId: string): Promise<Session> {
        return this.databaseService.deleteSession(userId);
    }
}
