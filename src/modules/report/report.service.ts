import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Report, User } from '@prisma/client';

@Injectable()
export class ReportService {
    constructor(private readonly databaseService: DatabaseService) {}
    
    async getAllUsers(): Promise<User[]> {
        return this.databaseService.getUsers()
    }
}
