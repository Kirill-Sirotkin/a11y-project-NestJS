import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthDto } from 'src/auth/dto/auth.dto';
import { DatabaseService } from 'src/services/database/database.service';
import * as argon2 from 'argon2';
import { Request } from 'express';

@Injectable()
export class AuthLoginService implements CanActivate {
    constructor(private readonly databaseService: DatabaseService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const body = await this.extractAuthDataFromBody(request);
      if (!body) {
        throw new UnauthorizedException();
      }
      try {
        const user = await this.databaseService.getUserByEmail(body.email);
        if (user === null) throw new UnauthorizedException();
        if (await argon2.verify(user.password, body.password)) {
          return true;
        } else {
          return false;
        }
      } catch {
        throw new UnauthorizedException();
      }
    }

    private async extractAuthDataFromBody(request: Request): Promise<AuthDto | null> {
      if (request.body === null) return null
      const body = request.body
      return body
    }
}
