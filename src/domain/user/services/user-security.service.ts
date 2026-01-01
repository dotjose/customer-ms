import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { User, UserStatus } from "../user.entity";
import { IPasswordHasher } from "../interfaces/password-hasher.interface";

@Injectable()
export class UserSecurityService {
  constructor(
    @Inject("IPasswordHasher") private readonly hasher: IPasswordHasher
  ) {}

  /**
   * Validates a login attempt.
   * Throws UnauthorizedException with specific (but user-friendly) messages if validation fails.
   * Note: The caller (Handler) is responsible for fetching the user first.
   * This service assumes the user exists if passed, or handles the null case if desired,
   * but typically the handler handles "User not found" to prevent enumeration before calling this.
   */
  async validateLogin(user: User, passwordAttempt: string): Promise<void> {
    // 1. Validate Password (Credentials First)
    const isPasswordValid = await this.hasher.compare(
      passwordAttempt,
      user.password
    );

    if (!isPasswordValid) {
      // Generic error to match "User not found" scenarios from the handler
      throw new UnauthorizedException(
        "We couldn't sign you in with the provided details. Please try again."
      );
    }

    // 2. Check Verification Status
    if (!user.isVerified) {
      throw new UnauthorizedException(
        "Please verify your account before signing in."
      );
    }

    // 3. Check Account Status
    this.ensureAccountIsActive(user);
  }

  /**
   * Validates if a user is eligible for a password reset.
   * Throws exceptions if the user is suspended or banned.
   */
  validatePasswordReset(user: User): void {
    // 1. Check Account Status
    // We do NOT check verification here necessarily, as they might be doing a reset to verify,
    // but typically suspended users cannot reset passwords.
    this.ensureAccountIsActive(user);
  }

  private ensureAccountIsActive(user: User): void {
    switch (user.status) {
      case UserStatus.ACTIVE:
        return;
      case UserStatus.SUSPENDED:
        throw new UnauthorizedException(
          "Your account is currently unavailable. Please contact support for assistance."
        );
      case UserStatus.BANNED:
      case UserStatus.BLOCKED:
        throw new UnauthorizedException(
          "Access to this account has been restricted. Please contact support."
        );
      default:
        // Graceful fallback for unknown statuses
        throw new UnauthorizedException(
          "We couldn't sign you in. Please contact support."
        );
    }
  }
}
