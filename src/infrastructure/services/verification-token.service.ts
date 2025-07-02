import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { randomInt } from "crypto";

export interface VerificationTokenPayload {
  userId: string;
  token: string;
  expiresAt: Date;
}

@Injectable()
export class VerificationTokenService {
  private readonly tokenExpiryMinutes = 5;

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async generateToken(userId: string): Promise<string> {
    const token = randomInt(100000, 999999).toString();
    const expiresAt = new Date(
      Date.now() + this.tokenExpiryMinutes * 60 * 1000
    );

    const payload = {
      userId,
      token,
      expiresAt: expiresAt.toISOString(), // ensure serializable
    };

    await this.cacheManager.set(`verification:${userId}`, payload, {
      ttl: this.tokenExpiryMinutes * 60, // ✅ correct format
    } as any);

    return token;
  }

  async verifyToken(userId: string, token: string): Promise<boolean> {
    const raw = await this.cacheManager.get<{
      userId: string;
      token: string;
      expiresAt: string;
    }>(`verification:${userId}`);

    if (!raw) return false;

    const payload: VerificationTokenPayload = {
      ...raw,
      expiresAt: new Date(raw.expiresAt),
    };

    if (payload.token !== token) return false;
    if (payload.expiresAt < new Date()) return false;

    await this.cacheManager.del(`verification:${userId}`);
    return true;
  }

  async resendToken(userId: string): Promise<string> {
    const raw = await this.cacheManager.get<{
      token: string;
    }>(`verification:${userId}`);

    if (!raw) {
      throw new Error(
        "No token exists for this user. Please request a new one."
      );
    }

    return raw.token;
  }
}
