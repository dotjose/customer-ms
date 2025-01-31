import { UserResponseDto } from "presentation/dtos/auth.dto";
import { User } from "./user.entity";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmailOrPhone(email: string): Promise<User | null>;
  findValidToken(token: string): Promise<User | null>;
  save(user: User): Promise<UserResponseDto>;
}
