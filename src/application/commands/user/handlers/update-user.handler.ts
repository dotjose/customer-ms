import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { ConflictException, Inject, Logger } from "@nestjs/common";
import { User, UserProps } from "domain/user/user.entity";
import { UserRepository } from "domain/user/user.repository";
import { UserResponseDto } from "presentation/dtos/auth.dto";
import { UpdateUserCommand } from "../update-user.command";
import { Types } from "mongoose";

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  private readonly logger = new Logger(UpdateUserHandler.name);

  constructor(
    @Inject("UserRepository") private readonly userRepository: UserRepository
  ) {}

  async execute(command: UpdateUserCommand): Promise<UserResponseDto> {
    const { profile } = command;

    this.logger.log("User profile update initiated", {
      id: profile.userId,
      timestamp: new Date().toISOString(),
    });

    // Validate user existence
    const existingUser = await this.userRepository.findById(profile.userId);
    if (!existingUser) {
      this.logger.error("User not found", {
        id: profile.userId,
        timestamp: new Date().toISOString(),
      });
      throw new ConflictException("User not found");
    }

    // Merge valid updates only
    const validUpdates = this.filterValidUpdates(profile, existingUser);

    // Merge the updates with the existing user data, while keeping the required fields
    const updatedUserProps: UserProps = {
      email: existingUser.email, // mandatory
      password: existingUser.password, // mandatory, if you don't update it
      firstName: existingUser.firstName, // mandatory
      lastName: existingUser.lastName, // mandatory
      roles: existingUser.roles, // mandatory
      isVerified: existingUser.isVerified, // mandatory
      phoneNumber: existingUser.phoneNumber, // mandatory
      createdAt: existingUser.createdAt, // mandatory
      updatedAt: new Date(), // will be updated
      ...validUpdates, // spread valid updates for optional fields like avatar, bio, etc.
    };

    const updatedUser = new User(
      updatedUserProps,
      new Types.ObjectId(existingUser.id)
    );

    // Save updated user
    const result = await this.userRepository.save(updatedUser);
    this.logger.log("User profile successfully updated", {
      userId: updatedUser.id,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  /**
   * Filters out undefined or invalid fields from the update request.
   */
  private filterValidUpdates(
    profile: Partial<UserProps>,
    existingUser: User
  ): Partial<UserProps> {
    const allowedFields = [
      "avatar",
      "firstName",
      "lastName",
      "bio",
      "socialLinks",
      "location",
    ];
    const updates: Partial<UserProps> = {};

    for (const field of allowedFields) {
      if (
        profile[field] !== undefined &&
        profile[field] !== existingUser[field]
      ) {
        updates[field] = profile[field];
      }
    }

    return updates;
  }
}
