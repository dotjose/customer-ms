import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "../services/jwt.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      const payload = await this.jwtService.verifyToken(token);
      // In a real app, you might want to fetch the user from DB to Ensure they still exist
      // or are not blocked. For now, we attach the payload (id, email, roles).
      request.user = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles,
      };
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
