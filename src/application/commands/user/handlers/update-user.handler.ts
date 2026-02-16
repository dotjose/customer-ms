import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { ConflictException, Inject, Logger } from "@nestjs/common";
import { Types } from "mongoose";

import { User, UserProps } from "domain/user/user.entity";
import { UserRepository } from "domain/user/user.repository";
import { UserResponseDto } from "presentation/dtos/auth.dto";
import { UpdateUserCommand } from "../update-user.command";

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  private readonly logger = new Logger(UpdateUserHandler.name);

  constructor(
    @Inject("UserRepository") private readonly userRepository: UserRepository
  ) { }

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
      status: existingUser.status, // mandatory
      isSystemUser: existingUser.isSystemUser, // mandatory
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
      const incomingValue = profile[field];

      if (incomingValue === undefined) continue;

      // 🔥 Special handling for location
      if (field === "location") {
        const existingLocation = existingUser.location;

        if (!incomingValue) continue;

        const hasValidCoordinates =
          Array.isArray(incomingValue.coordinates) &&
          incomingValue.coordinates.length === 2 &&
          !incomingValue.coordinates.includes(NaN);

        const hasValidAddress =
          typeof incomingValue.address === "string" &&
          incomingValue.address.trim().length > 0;

        // If location is incomplete → ignore it completely
        if (!hasValidCoordinates || !hasValidAddress) {
          continue;
        }

        // Merge safely instead of overwriting blindly
        updates.location = {
          ...existingLocation,
          ...incomingValue,
          city: incomingValue.city ?? existingLocation?.city ?? "",
          state: incomingValue.state ?? existingLocation?.state ?? "",
          country: incomingValue.country ?? existingLocation?.country ?? "",
        };

        continue;
      }

      // Normal fields
      if (incomingValue !== existingUser[field]) {
        updates[field] = incomingValue;
      }
    }

    return updates;
  }
}
