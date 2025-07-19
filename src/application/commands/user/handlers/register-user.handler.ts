import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import { ConflictException, Inject, Logger } from "@nestjs/common";

import { RegisterUserCommand } from "../register-user.command";
import { User } from "domain/user/user.entity";
import { UserRegisteredEvent } from "application/events/user/user-registered.event";
import { HashService } from "infrastructure/services/hash.service";
import { UserRepository } from "domain/user/user.repository";
import { UserResponseDto } from "presentation/dtos/auth.dto";

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler
  implements ICommandHandler<RegisterUserCommand>
{
  private readonly logger = new Logger(RegisterUserHandler.name);

  constructor(
    @Inject("UserRepository") private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: RegisterUserCommand): Promise<UserResponseDto> {
    const normalizedEmail = command.email.trim().toLowerCase();

    this.logger.log("User registration initiated", {
      email: `${normalizedEmail.slice(0, 3)}***`,
      timestamp: new Date().toISOString(),
    });

    const existingUser = await this.userRepository.findByEmailAndPhone(
      normalizedEmail,
      command.phoneNumber
    );

    if (existingUser) {
      this.logger.error("Duplicate user detected", {
        email: `${normalizedEmail.slice(0, 3)}***`,
        timestamp: new Date().toISOString(),
      });
      throw new ConflictException("Email or phone number already exists");
    }

    const hashedPassword = await this.hashService.hash(command.password);

    const user = new User({
      email: command.email,
      password: hashedPassword,
      firstName: command.firstName,
      lastName: command.lastName,
      phoneNumber: command.phoneNumber,
      roles: ["USER"],
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    try {
      const res = await this.userRepository.save(user);
      this.logger.log("User successfully registered", {
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      this.eventBus.publish(
        new UserRegisteredEvent(
          user.firstName,
          user.email,
          user.phoneNumber,
          user.id
        )
      );
      this.logger.log("UserRegisteredEvent published", {
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      return res;
    } catch (error: any) {
      // MongoDB duplicate key error code
      if (error.code === 11000) {
        this.logger.error("Duplicate key error on save", { error });
        throw new ConflictException("Email or phone number already exists");
      }

      // For any other error, rethrow
      this.logger.error("Error saving user", { error });
      throw error;
    }
  }
}
