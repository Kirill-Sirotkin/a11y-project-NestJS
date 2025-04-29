import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient, User, Report } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        await this.$connect();
    }
    
    async onModuleDestroy() {
        await this.$disconnect();
    }

    async getUsers(): Promise<User[]> {
        return this.user.findMany();
    }

    // also add this method without including reports
    async getUserById(id: string): Promise<User | null> {
        return this.user.findUnique({
            where: { id },
            include: { reports: true },
        });
    }

    // also add this method without including reports
    async getUserByEmail(email: string): Promise<User | null> {
        return this.user.findUnique({ 
            where: { email }, 
            include: { reports: true } 
        });
    }

    async getUserReports(id: string): Promise<Report[] | null> {
        return this.report.findMany({
            where: { userId: id },
            orderBy: {
            createdAt: "desc"
            }
        });
    }
}
