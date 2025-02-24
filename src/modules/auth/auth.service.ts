import { Injectable, NotFoundException } from '@nestjs/common';
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
        const user = await this.databaseService.postUser(data);
        return this.generateToken(user);
    }

    async login(email: string) {
        const user = await this.databaseService.getUserByEmail(email);
        if (user === null) {
            throw new NotFoundException("[ERROR] user not found");
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
