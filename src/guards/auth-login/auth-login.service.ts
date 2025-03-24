import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthDto } from 'src/modules/auth/dto/auth.dto';
import { DatabaseService } from 'src/services/database/database.service';
import * as argon2 from 'argon2';
import { Request } from 'express';

@Injectable()
export class AuthLoginService implements CanActivate {
    constructor(private readonly databaseService: DatabaseService) {}
            
    private readonly logger = new Logger(AuthLoginService.name);

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const body = this.extractAuthDataFromBody(request);
      if (!body) {
        this.logger.error(`Failed to validate password, request body with email and password was not passed`);
        throw new UnauthorizedException();
      }
      this.logger.warn(`Attempting to validate password for user: ${body.email}`);
      try {
        const user = await this.databaseService.getUserByEmail(body.email);
        if (user === null) throw new UnauthorizedException();
        if (await argon2.verify(user.password, body.password)) {
          this.logger.log(`Success to validate password for user: ${body.email}`);
          return true;
        } else {
          return false;
        }
      } catch {
        this.logger.error(`Failed to validate password for user: ${body.email}, wrong password or user does not exist`);
        throw new UnauthorizedException();
      }
    }

    private extractAuthDataFromBody(request: Request): AuthDto | null {
      if (request.body === null) return null
      const body = request.body
      return body
    }
}
