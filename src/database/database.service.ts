import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
      await this.$connect();
    }

    async getUsers() {
      return this.user.findMany();
    }

    async getUserById(id: string) {
      return this.user.findUnique({
        where: { id },
        include: { reports: true },
    });
    }

    async getReports() {
      return this.report.findMany();
    }

    async getReportById(id: string) {
      return this.report.findUnique({
        where: { id },
      });
    }
}
