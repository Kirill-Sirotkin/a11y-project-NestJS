import * as argon2 from 'argon2';
import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { LoginDataDto } from './dto/login-data.dto';
import { UserDataDto } from './dto/user-data.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { AccessTokenDto } from './dto/access-token.dto';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { ResetPasswordToken, Session, VerificationToken } from '@prisma/client';
import { GoogleUserDataDto } from './dto/google-user-data.dto';
import { ResendService } from 'nestjs-resend';
import { RegisterDataDto } from './dto/register-data.dto';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { JwtVerifyPayloadDto } from './dto/jwt-verify-payload.dto';
import { ResetPasswordTokenDto } from './dto/reset-password-token.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly jwtService: JwtService,
        private readonly resendService: ResendService
    ) {}

    async validateUserLocal(data: LoginDataDto): Promise<UserDataDto> {
        // add isVerified check here OR create decorator

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

    async validateUserJwtVerify(userId: string, verifyToken: string): Promise<void> {
        const verificationToken = await this.databaseService.getVerificationTokenByUserId(userId)
        if (!verificationToken) {
            throw new NotFoundException('verification token not found');
        }

        const isVerificationTokenValid = await argon2.verify(verificationToken.tokenHash, verifyToken);
        if (!isVerificationTokenValid) {
            throw new UnauthorizedException('verification token is invalid');
        }
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

    // async overrideAccessToken(userId: string, accessToken: string): Promise<void> {
    //     try {
    //         const accessTokenHash = await argon2.hash(accessToken);
    //         await this.databaseService.overrideAccessToken(userId, accessTokenHash);
    //     } catch (error) {
    //         throw new InternalServerErrorException(`failed to override access token: ${error}`)
    //     }
    // }

    async deleteSession(userId: string): Promise<Session> {
        return this.databaseService.deleteSession(userId);
    }

    async registerLocalUser(data: RegisterDataDto): Promise<UserDataDto> {
        try {
            const passwordHashNew = await argon2.hash(data.password);
            const user = await this.databaseService.createUser(data.email, passwordHashNew, false, false);
            const { passwordHash, ...userDto } = user;
            const { verifyToken } = await this.generateVerifyToken(userDto.id);
            const tokenHash = await argon2.hash(verifyToken);
            this.databaseService.overrideVerificationToken(userDto.id, tokenHash);
    
            await this.resendService.send({
                from: 'no-reply@a11y-server.xyz',
                to: userDto.email,
                subject: 'A11yReport Email Verification',
                text: `Please verify your email by clicking the link:\n\n${process.env.VERIFICATION_CALLBACK_URL}?verificationToken=${verifyToken}`,
            });
            
            return userDto as UserDataDto
        } catch (error) {
            throw new InternalServerErrorException(`failed to register new user: ${error}`)
        }
    }

    async generateVerifyToken(userId: string): Promise<VerifyTokenDto> {
        const payload: JwtVerifyPayloadDto = {
            sub: userId,
        }

        const verifyToken = this.jwtService.sign(payload, {
            expiresIn: process.env.JWT_VERIFY_EXPIRES_IN,
            secret: process.env.JWT_VERIFY_SECRET,
        })

        return { verifyToken }
    }

    async confirmEmailVerification(userId: string): Promise<UserDataDto> {
        const user = await this.databaseService.getUserById(userId);
        if (!user) {
            throw new NotFoundException('user not found');
        }

        const updatedUser = await this.databaseService.updateUserIsVerified(userId, true);
        const { passwordHash, ...userDto } = updatedUser;
        return userDto as UserDataDto
    }

    async resendEmailVerification(userId: string, verifyToken: string): Promise<void> {
        try {
            const user = await this.databaseService.getUserById(userId);
            if (!user) {
                throw new NotFoundException('user not found');
            }

            console.log(`userId: ${userId}, userEmail: ${user.email}, verifyToken: ${verifyToken}`)

            const tokenHash = await argon2.hash(verifyToken);
            await this.databaseService.overrideVerificationToken(userId, tokenHash);
            
            await this.resendService.send({
                from: 'no-reply@a11y-server.xyz',
                to: user.email,
                subject: 'A11yReport Email Verification',
                text: `Please verify your email by clicking the link:\n\n${process.env.VERIFICATION_CALLBACK_URL}?verificationToken=${verifyToken}`,
            });
        } catch (error) {
            throw new InternalServerErrorException(`failed to override verification token: ${error}`)
        }
    }

    async generateResetPasswordToken(userId: string): Promise<ResetPasswordTokenDto> {
        const payload: JwtVerifyPayloadDto = {
            sub: userId,
        }

        const resetPasswordToken = this.jwtService.sign(payload, {
            expiresIn: process.env.JWT_VERIFY_EXPIRES_IN,
            secret: process.env.JWT_VERIFY_SECRET,
        })

        return { resetPasswordToken }
    }
}
