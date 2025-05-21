import { Inject, Injectable } from "@nestjs/common";
import { randomInt } from "crypto";
import { Cache } from "cache-manager";

export interface VerificationTokenPayload {
  phoneNumber: string;
  token: string;
  expiresAt: Date;
}

@Injectable()
export class VerificationTokenService {
  private readonly tokenExpiryMinutes = 5;

  constructor(@Inject("CACHE_MANAGER") private readonly cacheManager: Cache) {}

  /**
   * Generates a 6-digit verification token and caches it.
   * @param phoneNumber User's phone number.
   * @returns The generated 6-digit token.
   */
  async generateToken(phoneNumber: string): Promise<string> {
    const token = randomInt(100000, 999999).toString(); // Generate 6-digit random number
    const expiresAt = new Date(
      Date.now() + this.tokenExpiryMinutes * 60 * 1000
    );

    const payload: VerificationTokenPayload = { phoneNumber, token, expiresAt };
    // Store in cache (keyed by phone number)
    await this.cacheManager.set(
      `verification:${phoneNumber}`,
      payload,
      this.tokenExpiryMinutes * 60
    );

    return token;
  }

  /**
   * Verifies the 6-digit token.
   * @param phoneNumber User's phone number.
   * @param token The token to validate.
   * @returns Whether the token is valid.
   */
  async verifyToken(phoneNumber: string, token: string): Promise<boolean> {
    const payload: VerificationTokenPayload | undefined =
      await this.cacheManager.get(`verification:${phoneNumber}`);

    if (!payload) {
      return false; // Token not found or expired
    }

    // Compare as strings
    if (payload.token !== token.toString()) {
      return false; // Token mismatch
    }

    // Ensure date comparison is valid
    if (new Date(payload.expiresAt) < new Date()) {
      return false; // Token expired
    }

    // Token is valid, remove it to prevent reuse
    await this.cacheManager.del(`verification:${phoneNumber}`);
    return true;
  }

  /**
   * Resends the token without generating a new one.
   * @param phoneNumber User's phone number.
   * @returns The existing token for resending.
   */
  async resendToken(phoneNumber: string): Promise<string> {
    const payload: VerificationTokenPayload | undefined =
      await this.cacheManager.get(`verification:${phoneNumber}`);

    if (!payload) {
      throw new Error(
        "No token exists for this phone number. Please request a new one."
      );
    }

    return payload.token;
  }
}
