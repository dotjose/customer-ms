import { Admin } from "./admin.entity";

export interface AdminRepository {
  findById(id: string): Promise<Admin | null>;
  findByEmail(email: string): Promise<Admin | null>;
  save(admin: Admin): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(query: any): Promise<{ items: Admin[]; total: number }>;
}
