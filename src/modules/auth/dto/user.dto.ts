import { Role, SubscriptionStatus } from "@prisma/client";

// export class UserDto implements User {
export class UserDto {
    id: string;
    email: string;
    name: string | null;
    organization: string | null;
    isVerified: boolean;
    role: Role;
    subscription: SubscriptionStatus;
    createdAt: Date;
    updatedAt: Date;
}
