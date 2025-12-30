import { SetMetadata } from "@nestjs/common";
import { UserRole } from "domain/user/user.entity";

export const Roles = (...roles: UserRole[]) => SetMetadata("roles", roles);
