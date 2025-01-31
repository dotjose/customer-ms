import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import {
  Inject,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { UpdatePasswordCommand } from "../update-password.command";
import { UserRepository } from "domain/user/user.repository";
import { HashService } from "infrastructure/services/hash.service";
import { PasswordResetCompletedEvent } from "application/events/user/password-reset-completed.event";

@CommandHandler(UpdatePasswordCommand)
export class UpdatePasswordHandler
  implements ICommandHandler<UpdatePasswordCommand>
{
  private readonly logger = new Logger(UpdatePasswordHandler.name);

  constructor(
    @Inject("UserRepository") private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: UpdatePasswordCommand) {
    this.logger.log("Starting password update process", {
      password: "masked",
      timestamp: new Date().toISOString(),
    });

    // Validate user existance
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      this.logger.warn(`User not found with id ${command.userId}`);
      throw new NotFoundException("User not found");
    }

    // Validate password
    const isPasswordValid = await this.hashService.compare(
      command.currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      this.logger.warn(
        `Update password failed: Invalid password for user ${user.id}`
      );
      throw new UnauthorizedException("Invalid credentials");
    }

    try {
      const hashedPassword = await this.hashService.hash(command.newPassword);
      user.updatePassword(hashedPassword);

      this.eventBus.publish(
        new PasswordResetCompletedEvent("Password update completed", user.email)
      );

      this.logger.log("Password update successfully completed", {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });

      return { message: "Password successfully updated" };
    } catch (error) {
      this.logger.error("Error during password updated", {
        userId: user?.id,
        email: user?.email,
        error,
      });
      throw error;
    }
  }
}
