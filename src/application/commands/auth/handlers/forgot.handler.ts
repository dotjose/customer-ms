import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import { Inject, Logger, NotFoundException } from "@nestjs/common";

import { UserRepository } from "domain/user/user.repository";
import { UserSecurityService } from "domain/user/services/user-security.service";
import { VerificationTokenService } from "infrastructure/services/verification-token.service";
import { PasswordResetRequestedEvent } from "application/events/user/password-reset-requested.event";
import { ForgotPasswordCommand } from "../forgot.command";

@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler
  implements ICommandHandler<ForgotPasswordCommand>
{
  private readonly logger = new Logger(ForgotPasswordHandler.name);

  constructor(
    @Inject("UserRepository") private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
    private readonly verificationTokenService: VerificationTokenService,
    private readonly userSecurityService: UserSecurityService
  ) {}

  async execute(command: ForgotPasswordCommand) {
    const normalizedEmail = command.email.trim().toLowerCase();
    
    // Log intent safe
    this.logger.log(`Password reset requested for: ${this.maskEmail(normalizedEmail)}`);

    // 1. Fetch User
    const user = await this.userRepository.findByEmailOrPhone(normalizedEmail);

    // 2. Silent Failure: If user not found, return random success message anyway
    if (!user) {
      this.logger.warn(`Password reset ignored: User not found for ${this.maskEmail(normalizedEmail)}`);
      throw new NotFoundException("User not found with the provided information.");
    }

    try {
        // 3. Validation (Check if Active)
       this.userSecurityService.validatePasswordReset(user);

       // 4. Generate Token
      const resetToken = await this.verificationTokenService.generateToken(
        user.phoneNumber
      );

      user.setResetToken(resetToken);
      const result = await this.userRepository.save(user);
      console.log(result, "wtf!")

      // 5. Publish Event (Sends Email)
      this.eventBus.publish(
        new PasswordResetRequestedEvent(
          "Password Reset Requested",
          user.email,
          user.phoneNumber,
          resetToken
        )
      );

      this.logger.log(`Password reset email triggered for user: ${user.id}`);
      
      return { message: "Password reset instructions sent." };

    } catch (error) {
        // 6. Silent Failure: If validation failed (e.g. Suspended), log it but return success
        this.logger.warn(`Password reset blocked for user ${user.id}: ${error.message}`);
        // We do NOT rethrow. We return the same generic message.
    }
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***';
    return `${local.slice(0, 3)}***@${domain}`;
  }
}
