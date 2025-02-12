import { User } from "domain/user/user.entity";
import { UserResponseDto } from "presentation/dtos/auth.dto";

export class UserMapper {
  static toResponse(user: User): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      email: user.email,
      location: user.location,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  static toResponseList(users: User[]): UserResponseDto[] {
    return users.map((user) => this.toResponse(user));
  }
}
