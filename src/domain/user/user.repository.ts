import { UserResponseDto } from "presentation/dtos/auth.dto";
import { User } from "./user.entity";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmailOrPhone(email: string): Promise<User | null>;
  findByEmailAndPhone(email: string, phone: string): Promise<User | null>;
  findValidToken(token: string): Promise<User | null>;
  save(user: User): Promise<UserResponseDto>;
  delete(id: string): Promise<void>;
  findAll(query: any): Promise<{ items: User[]; total: number }>;
}
