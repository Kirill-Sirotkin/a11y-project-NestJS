import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from 'src/services/database/database.service';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthJwtService implements CanActivate {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly jwtService: JwtService
    ) {}
        
    private readonly logger = new Logger(AuthJwtService.name);

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromBody(request);
        this.logger.warn(`Attempting to validate JWT: ${token}`);
        if (!token) {
            this.logger.error(`Failed to validate JWT: ${token}, token was not passed`);
            throw new UnauthorizedException("Token was not passed");
        }    
        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: process.env.JWT_SECRET,
                }
            );
            request['user'] = payload;
        } catch {
            this.logger.error(`Failed to validate JWT: ${token}, token is invalid`);
            throw new UnauthorizedException("Token is invalid");
        }
        this.logger.log(`Success to validate JWT: ${token}`);
        return true;
    }

    private extractTokenFromBody(request: Request): string | null {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : null;
    }
}
