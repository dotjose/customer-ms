import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import { BadRequestException, Inject, Logger } from "@nestjs/common";

import { UserRepository } from "domain/user/user.repository";
import { UserSecurityService } from "domain/user/services/user-security.service";
import { IPasswordHasher } from "domain/user/interfaces/password-hasher.interface";
import { PasswordResetCompletedEvent } from "application/events/user/password-reset-completed.event";
import { ResetPasswordCommand } from "../reset-password.command";

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler
  implements ICommandHandler<ResetPasswordCommand>
{
  private readonly logger = new Logger(ResetPasswordHandler.name);

  constructor(
    @Inject("UserRepository") private readonly userRepository: UserRepository,
    @Inject("IPasswordHasher") private readonly hasher: IPasswordHasher,
    private readonly eventBus: EventBus,
    private readonly userSecurityService: UserSecurityService
  ) {}

  async execute(command: ResetPasswordCommand) {
    this.logger.log("Starting password reset process", {
      token: "masked",
      timestamp: new Date().toISOString(),
    });

    // 1. Find User by Token
    const user = await this.userRepository.findValidToken(command.token);

    if (!user) {
      this.logger.warn("Invalid or expired reset token");
      throw new BadRequestException("Invalid or expired reset token");
    }

    // 2. Security Check: Ensure User is Active
    // This blocks Suspended/Banned users from resetting even with a valid token
    this.userSecurityService.validatePasswordReset(user);

    try {
      // 3. Update Password
      const hashedPassword = await this.hasher.hash(command.newPassword);

      user.updatePassword(hashedPassword);
      await this.userRepository.save(user);

      this.eventBus.publish(
        new PasswordResetCompletedEvent("Password reset completed", user.email)
      );

      this.logger.log(`Password reset successfully completed for user: ${user.id}`);

      return { message: "Password successfully reset" };
    } catch (error) {
      this.logger.error("Error during password reset", {
        userId: user?.id,
        error: error.message,
      });
      throw error;
    }
  }
}
