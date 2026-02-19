import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { ConflictException, Inject, Logger } from "@nestjs/common";
import { Types } from "mongoose";

import { User, UserProps } from "domain/user/user.entity";
import { UserRepository } from "domain/user/user.repository";
import { LocationDto, UserResponseDto } from "presentation/dtos/auth.dto";
import { UpdateUserCommand } from "../update-user.command";

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  private readonly logger = new Logger(UpdateUserHandler.name);

  constructor(
    @Inject("UserRepository") private readonly userRepository: UserRepository,
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
      new Types.ObjectId(existingUser.id),
    );

    // Save updated user
    const result = await this.userRepository.save(updatedUser);
    this.logger.log("User profile successfully updated", {
      userId: updatedUser.id,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  private filterValidUpdates(
    profile: Partial<UserProps>,
    existingUser: User,
  ): Partial<UserProps> {
    const allowedFields: (keyof UserProps)[] = [
      "avatar",
      "firstName",
      "lastName",
      "bio",
      "socialLinks",
      "location",
    ];

    const updates: Partial<UserProps> = {};

    const isValidLocation = (value: any): value is LocationDto => {
      return (
        value &&
        typeof value === "object" &&
        Array.isArray(value.coordinates) &&
        value.coordinates.length === 2 &&
        value.coordinates.every(
          (c) => typeof c === "number" && !Number.isNaN(c),
        ) &&
        typeof value.address === "string" &&
        value.address.trim().length > 0 &&
        typeof value.country === "string" &&
        value.country.trim().length > 0
      );
    };

    for (const field of allowedFields) {
      const incomingValue = profile[field];
      if (incomingValue === undefined) continue;

      // Location field
      if (field === "location") {
        if (
          incomingValue &&
          typeof incomingValue === "object" &&
          isValidLocation(incomingValue)
        ) {
          const loc = incomingValue as LocationDto;

          // Only include optional fields if they exist
          const locationPayload: Partial<LocationDto> = {
            type: "Point",
            coordinates: loc.coordinates,
            address: loc.address.trim(),
            country: loc.country.trim(),
            city: existingUser.location.address !== loc.address ? loc.city : existingUser.location.city,
            state: existingUser.location.address !== loc.address ? loc.state : existingUser.location.state,
          };
          updates.location = locationPayload;
        }
        continue;
      }

      // Other fields: assign as-is
      (updates as any)[field] = incomingValue;
    }
    console.log("updates triggered", updates);
    return updates;
  }
}
