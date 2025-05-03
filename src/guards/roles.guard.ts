import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { ROLES_KEY } from "src/decorators/roles.decorator";
import { JwtPayloadDto } from "src/modules/auth/dto/jwt-payload.dto";


@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const user: JwtPayloadDto = context.switchToHttp().getRequest().user;
        const isRequiredRolesExist = requiredRoles.some((role) => user.role === role);
        console.log(`user: ${user.role}, required: ${requiredRoles}`)

        return isRequiredRolesExist
    }
}