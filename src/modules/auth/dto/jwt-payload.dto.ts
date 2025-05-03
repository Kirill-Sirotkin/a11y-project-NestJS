import { Role } from "@prisma/client";

export class JwtPayloadDto {
    sub: string;
    role: Role;
    isActive: boolean;
    isVerified: boolean;
    iat?: number;
    exp?: number;
}