import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/services/database/database.service';
import { AuthDto } from './dto/auth.dto';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly jwtService: JwtService
    ) {}

    async register(data: AuthDto) {
        const dbUser = await this.databaseService.postUser(data);
        if (dbUser instanceof Error) {
            // error
            return dbUser;
        }

        return this.generateToken(dbUser);
    }

    async login(email: string) {
        // return new token
        const user = await this.databaseService.getUserByEmail(email);
        if (user === null) {
            // null user by email
            return user;
        }
        
        return this.generateToken(user);
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

        return this.jwtService.signAsync(payload);
    }
}
