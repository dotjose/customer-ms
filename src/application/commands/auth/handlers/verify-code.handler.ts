import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import { UnauthorizedException, Logger, Inject } from "@nestjs/common";

import { VerifyCodeCommand } from "../verify-code.command";
import { UserRepository } from "domain/user/user.repository";
import { VerificationTokenService } from "infrastructure/services/verification-token.service";
import { UserVerifiedEvent } from "domain/events/user/user-verified.event";

@CommandHandler(VerifyCodeCommand)
export class VerifyCodeHandler implements ICommandHandler<VerifyCodeCommand> {
  private readonly logger = new Logger(VerifyCodeHandler.name);

  constructor(
    @Inject("UserRepository") private readonly userRepository: UserRepository,
    private readonly verificationTokenService: VerificationTokenService,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: VerifyCodeCommand): Promise<{ message: string }> {
    const { userId, phone, code } = command;

    this.logger.log(`Verifying code for userId: ${userId}`);

    // Fetch user by ID
    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.warn(`User not found for userId: ${userId}`);
      throw new UnauthorizedException("User not found");
    }

    // Verify the provided code
    const isCodeValid = await this.verificationTokenService.verifyToken(
      phone,
      code
    );
    if (!isCodeValid) {
      this.logger.warn(`Invalid verification code for userId: ${userId}`);
      throw new UnauthorizedException("Invalid verification code");
    }

    // Mark user as verified
    user.verify();
    await this.userRepository.save(user);

    // Publish user verified event
    this.eventBus.publish(new UserVerifiedEvent(user.id, user.email));
    this.logger.log(`User verified successfully for userId: ${userId}`);

    // Return success response
    return { message: "User verified successfully" };
  }
}
