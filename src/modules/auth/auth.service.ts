import * as argon2 from 'argon2';
import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { TokenPairDto } from './dto/token-pair.dto';
import { ResendService } from 'nestjs-resend';
import { RegisterDataDto } from './dto/register-data.dto';
import { TokenGenerationService } from '../token-generation/token-generation.service';
import { ResetPasswordDataDto } from './dto/reset-password-data.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly resendService: ResendService,
        private readonly tokenGenerationService: TokenGenerationService,
    ) {}

    private async overrideSession(userId: string, accessToken: string, refreshToken: string): Promise<void> {
        try {
            const accessTokenHash = await argon2.hash(accessToken);
            const refreshTokenHash = await argon2.hash(refreshToken);
    
            await this.databaseService.overrideSession(userId, accessTokenHash, refreshTokenHash);
        } catch (error) {
            throw new InternalServerErrorException(`failed to override session: ${error}`)
        }
    }

    async register(data: RegisterDataDto): Promise<TokenPairDto> {
        try {
            const registerPasswordHash = await argon2.hash(data.password);
            const user = await this.databaseService.createUser(data.email, registerPasswordHash, false, false);
            const { passwordHash, ...userDto } = user;

            const { verifyToken } = await this.tokenGenerationService.generateVerifyToken(userDto.id);
            const tokenHash = await argon2.hash(verifyToken);
            this.databaseService.overrideVerificationToken(userDto.id, tokenHash);
    
            await this.resendService.send({
                from: 'no-reply@a11y-server.xyz',
                to: userDto.email,
                subject: 'A11yReport Email Verification',
                text: `Please verify your email by clicking the link:\n\n${process.env.VERIFICATION_CALLBACK_URL}?verificationToken=${verifyToken}`,
            });
            
            const { accessToken } = await this.tokenGenerationService.generateAccessToken(userDto.id);
            const { refreshToken } = await this.tokenGenerationService.generateRefreshToken(userDto.id);

            this.overrideSession(userDto.id, accessToken, refreshToken);

            return { accessToken, refreshToken}
        } catch (error) {
            throw new InternalServerErrorException(`failed to register new user: ${error}`)
        }
    }

    async verify(userId: string): Promise<boolean> {
        const user = await this.databaseService.getUserById(userId);
        if (!user) {
            throw new NotFoundException('user not found');
        }

        await this.databaseService.updateUserIsVerified(userId, true);
        return true
    }

    async resendVerification(userId: string): Promise<boolean> {
        try {
            const { verifyToken } = await this.tokenGenerationService.generateVerifyToken(userId);

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

            return true
        } catch (error) {
            throw new InternalServerErrorException(`failed to override verification token: ${error}`)
        }
    }

    async login(userId: string): Promise<TokenPairDto> {
        const { accessToken } = await this.tokenGenerationService.generateAccessToken(userId);
        const { refreshToken } = await this.tokenGenerationService.generateRefreshToken(userId);
        this.overrideSession(userId, accessToken, refreshToken);
        return { accessToken, refreshToken }
    }

    async refresh(userId: string): Promise<TokenPairDto> {
        const { accessToken } = await this.tokenGenerationService.generateAccessToken(userId);
        const { refreshToken } = await this.tokenGenerationService.generateRefreshToken(userId);
        this.overrideSession(userId, accessToken, refreshToken);
        return { accessToken, refreshToken }
    }

    async logout(userId: string): Promise<boolean> {
        await this.databaseService.deleteSession(userId);
        return true
    }

    async googleCallback(userId: string): Promise<TokenPairDto> {
        const { accessToken } = await this.tokenGenerationService.generateAccessToken(userId);
        const { refreshToken } = await this.tokenGenerationService.generateRefreshToken(userId);
        this.overrideSession(userId, accessToken, refreshToken);
        return { accessToken, refreshToken }
    }

    async resetPassword(email: string): Promise<boolean> {
        try {
            const user = await this.databaseService.getUserByEmail(email);
            if (!user) {
                // log the error but don't throw an exception to avoid leaking user data
                return true
            }
    
            const { resetPasswordToken } = await this.tokenGenerationService.generateResetPasswordToken(user.id);
            const tokenHash = await argon2.hash(resetPasswordToken);
            await this.databaseService.overrideResetPasswordToken(user.id, tokenHash);
    
            await this.resendService.send({
                from: 'no-reply@a11y-server.xyz',
                to: user.email,
                subject: 'A11yReport Password Reset',
                text: `Password reset was requested for this account.\nIf this wasn't you, you can ignore this email.\nTo reset the password, please follow this link:\n\n${process.env.RESET_PASSWORD_CALLBACK_URL}?resetPasswordToken=${resetPasswordToken}`,
            });

            return true
        } catch (error) {
            return true
        }
    }

    async resetPasswordCallback(userId: string, passwords: ResetPasswordDataDto): Promise<boolean> {
        try {
            const user = await this.databaseService.getUserById(userId);
            if (!user) {
                throw new NotFoundException('user not found');
            }
    
            const passwordHash = await argon2.hash(passwords.password);
            await this.databaseService.updateUserPasswordHash(user.id, passwordHash);
    
            console.log(`old password hash: ${user.passwordHash}; new hash: ${passwordHash}`)

            return true
        } catch (error) {
            throw new InternalServerErrorException(`failed to reset password: ${error}`)
        }
    }
}
