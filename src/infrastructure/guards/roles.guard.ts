import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "domain/user/user.entity";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.roles) {
      throw new ForbiddenException("Access denied: No roles found");
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    
    if (!hasRole) {
      throw new ForbiddenException("Access denied: Insufficient permissions");
    }

    return true;
  }
}
