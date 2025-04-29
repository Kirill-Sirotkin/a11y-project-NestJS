import * as argon2 from 'argon2';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LoginDataDto } from './dto/login-data.dto';
import { UserDataDto } from './dto/user-data.dto';

@Injectable()
export class AuthService {
    constructor(private readonly databaseService: DatabaseService) {}

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
}
