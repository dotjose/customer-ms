import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import { ResendVerificationCommand } from "../resend-verification.command";
import { UserRepository } from "domain/user/user.repository";
import { VerificationTokenService } from "infrastructure/services/verification-token.service";
import { NotFoundException, Logger, Inject } from "@nestjs/common";
import { VerificationCodeGeneratedEvent } from "application/events/user/verification-code-generated.event";

@CommandHandler(ResendVerificationCommand)
export class ResendVerificationHandler
  implements ICommandHandler<ResendVerificationCommand>
{
  private readonly logger = new Logger(ResendVerificationHandler.name);

  constructor(
    @Inject("UserRepository") private readonly userRepository: UserRepository,
    private readonly verificationTokenService: VerificationTokenService,
    private readonly eventBus: EventBus
  ) {}

  async execute(
    command: ResendVerificationCommand
  ): Promise<{ message: string }> {
    const { userId } = command;

    this.logger.log(`Resending verification code for userId: ${userId}`);

    // Fetch user by ID
    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.warn(`User not found for userId: ${userId}`);
      throw new NotFoundException("User not found");
    }

    // Generate verification code
    const verificationCode =
      await this.verificationTokenService.generateToken(userId);

    // Publish verification code generated event
    this.eventBus.publish(
      new VerificationCodeGeneratedEvent(
        user.fullName,
        user.email,
        user.phoneNumber,
        verificationCode
      )
    );

    this.logger.log(`Verification code sent for userId: ${userId}`);

    // Return success message
    return { message: "Verification code sent successfully" };
  }
}
