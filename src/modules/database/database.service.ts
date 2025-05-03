import { Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient, User, Report, Session, Prisma } from '@prisma/client';

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
            orderBy: { createdAt: "desc" }
        });
    }

    async createUser(
        email: string, 
        passwordHash: string | null, 
        isVerified: boolean, 
        isOAuth: boolean
    ): Promise<User> {
        if (isOAuth) {
            return this.user.create({
                data: {
                    email,
                    isVerified,
                    isOAuth,
                }
            })
        }

        return this.user.create({
            data: {
                email,
                passwordHash,
                isVerified,
                isOAuth,
            }
        })
    }

    async overrideSession(
        userId: string, 
        accessTokenHash: string, 
        refreshTokenHash: string
    ): Promise<Session> {
        const session = await this.session.findFirst({
            where: { userId },
        });

        if (session) {
            return this.session.update({
                where: { id: session.id },
                data: {
                    accessTokenHash,
                    refreshTokenHash,
                },
            });
        }

        return this.session.create({
            data: {
                accessTokenHash,
                refreshTokenHash,
                user: {
                    connect: { id: userId}
                }
            },
        });
    }

    async overrideAccessToken(
        userId: string, 
        accessTokenHash: string
    ): Promise<Session> {
        return this.$transaction(async (prisma) => {
            const session = await this.getSessionByUserId(userId);
    
            return this.session.update({
                where: { id: session.id },
                data: {
                    accessTokenHash,
                },
            });
        })
    }

    async deleteSession(userId: string): Promise<Session> {
        const session = await this.getSessionByUserId(userId);

        return this.session.delete({
            where: { id: session.id },
        });
    }

    async getSessionByUserId(userId: string): Promise<Session> {
        const session = await this.session.findFirst({
            where: { userId },
        });

        if (!session) {
            throw new NotFoundException("session not found");
        }

        return session;
    }
}
