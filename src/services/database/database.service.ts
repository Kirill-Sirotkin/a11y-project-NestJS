import { Injectable, InternalServerErrorException, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient, User, Report, ReportStatus } from '@prisma/client';
import * as argon2 from 'argon2';

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

    async postUser(data: { email: string, password: string }): Promise<User> {
      try {
        const hash = await argon2.hash(data.password);
        return this.user.create({
          data: {
            email: data.email,
            password: hash,
        }
      });
      } catch (err) {
        throw new InternalServerErrorException("[ERROR] failed to create user: " + err);
      }
    }

    async getReports(): Promise<Report[]> {
      return this.report.findMany();
    }

    async getReportById(id: string): Promise<Report | null> {
      return this.report.findUnique({
        where: { id },
      });
    }

    async postReport(data: { userId: string, domain: string }): Promise<Report> {
      if (!await this.user.findUnique({ where: { id: data.userId } })) 
        throw new NotFoundException("[ERROR] cannot create report for user " + data.userId + ": user not found");
      return this.report.create({
        data: {
          domain: data.domain,
          author: {
            connect: { id: data.userId },
          },
        },
      });
    }

    async patchReport(id: string, data: { fileName: string, status: ReportStatus }): Promise<Report> {
      return this.report.update({
        where: { id },
        data,
      });
    }
}
