import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

export enum NewsletterTokenType {
  UNSUBSCRIBE = "UNSUBSCRIBE",
  PREFERENCES = "PREFERENCES",
}

@Injectable()
export class NewsletterTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async generateToken(email: string, type: NewsletterTokenType): Promise<string> {
    const payload = {
      email,
      type,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("JWT_SECRET"),
      expiresIn: type === NewsletterTokenType.UNSUBSCRIBE ? "30d" : "7d",
    });
  }

  async verifyToken(token: string, expectedType: NewsletterTokenType): Promise<string> {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>("JWT_SECRET"),
    });

    if (payload.type !== expectedType) {
      throw new Error("Invalid token type");
    }

    return payload.email;
  }
}
