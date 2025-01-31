import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import { BadRequestException, Inject, Logger } from "@nestjs/common";
import { ResetPasswordCommand } from "../reset-password.command";
import { UserRepository } from "domain/user/user.repository";
import { HashService } from "infrastructure/services/hash.service";
import { PasswordResetCompletedEvent } from "application/events/user/password-reset-completed.event";

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler
  implements ICommandHandler<ResetPasswordCommand>
{
  private readonly logger = new Logger(ResetPasswordHandler.name);

  constructor(
    @Inject("UserRepository") private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: ResetPasswordCommand) {
    this.logger.log("Starting password reset process", {
      token: "masked",
      timestamp: new Date().toISOString(),
    });

    const user = await this.userRepository.findValidToken(command.token);

    if (!user) {
      this.logger.warn("Invalid or expired reset token", { token: "masked" });
      throw new BadRequestException("Invalid or expired reset token");
    }

    try {
      const hashedPassword = await this.hashService.hash(command.newPassword);
      user.updatePassword(hashedPassword);

      this.eventBus.publish(
        new PasswordResetCompletedEvent("Password reset completed", user.email)
      );

      this.logger.log("Password reset successfully completed", {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });

      return { message: "Password successfully reset" };
    } catch (error) {
      this.logger.error("Error during password reset", {
        userId: user?.id,
        email: user?.email,
        error,
      });
      throw error;
    }
  }
}
