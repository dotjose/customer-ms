import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import { Inject, Logger, NotFoundException } from "@nestjs/common";
import { ForgotPasswordCommand } from "../forgot.command";
import { UserRepository } from "domain/user/user.repository";
import { VerificationTokenService } from "infrastructure/services/verification-token.service";
import { PasswordResetRequestedEvent } from "application/events/user/password-reset-requested.event";

@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler
  implements ICommandHandler<ForgotPasswordCommand>
{
  private readonly logger = new Logger(ForgotPasswordHandler.name);

  constructor(
    @Inject("UserRepository") private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
    private readonly verificationTokenService: VerificationTokenService
  ) {}

  async execute(command: ForgotPasswordCommand) {
    const normalizedEmail = command.email.trim().toLowerCase();
    this.logger.log("Password reset requested", {
      email: `${normalizedEmail.slice(0, 3)}***`,
      timestamp: new Date().toISOString(),
    });

    const user = await this.userRepository.findByEmailOrPhone(normalizedEmail);

    if (!user) {
      this.logger.warn("User not found", {
        email: `${normalizedEmail.slice(0, 3)}***`,
      });
      throw new NotFoundException("User not found");
    }

    try {
      const resetToken = await this.verificationTokenService.generateToken(
        user.phoneNumber
      );
      this.logger.log("Reset token generated successfully", {
        userId: user.id,
      });

      user.setResetToken(resetToken);

      this.eventBus.publish(
        new PasswordResetRequestedEvent(
          "Password Reset Requested",
          user.email,
          user.phoneNumber,
          resetToken
        )
      );

      this.logger.log("PasswordResetRequestedEvent published", {
        userId: user.id,
      });

      return { message: "Password reset email sent" };
    } catch (error) {
      this.logger.error("Error in ForgotPasswordHandler", {
        userId: user?.id,
        error,
      });
      throw error;
    }
  }
}
