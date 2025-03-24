import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/services/database/database.service';
import { AuthDto } from './dto/auth.dto';
import { User } from '@prisma/client';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly databaseService: DatabaseService,
        private jwtService: JwtService,
    ) {}
    
    private readonly logger = new Logger(AuthService.name);

    async register(data: AuthDto) {
        const user = await this.databaseService.postUser(data);
        const tokenString = await this.generateToken(user)
        const tokenJson = {token: tokenString}
        return tokenJson;
    }

    async login(email: string) {
        this.logger.warn(`Attempting to login user with email: ${email}`);
        const user = await this.databaseService.getUserByEmail(email);
        if (user === null) {
            this.logger.error(`Failed to login user with email: ${email}, user not found`);
            throw new NotFoundException("[ERROR] user not found");
        }
        const tokenString = await this.generateToken(user)
        const tokenJson = {token: tokenString}
        this.logger.log(`Success to login user with email: ${email}`);
        return tokenJson;
    }
        
        private async generateToken(user: User): Promise<string> {
            const payload = {
                id: user.id,
                email: user.email,
                name: user.name,
                organization: user.organization,
                isVerified: user.isVerified,
                role: user.role,
                subscription: user.subscription,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
            const opts: JwtSignOptions = { secret: process.env.JWT_SECRET, expiresIn: '14d' };
            return this.jwtService.signAsync(payload, opts);
        }
}
