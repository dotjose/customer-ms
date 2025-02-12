import { ConsultantWithUserDetails } from "presentation/dtos/consultant.dto";
import { Consultant } from "./consultant.entity";
import { LocationDto } from "presentation/dtos/auth.dto";

export interface ConsultantRepository {
  findById(id: string): Promise<Consultant | null>;
  getConsultantDetails(id: string): Promise<ConsultantWithUserDetails>;
  findAll(): Promise<ConsultantWithUserDetails[]>;
  findByIds(ids: string[]): Promise<ConsultantWithUserDetails[]>;
  findByUserId(id: string): Promise<Consultant | null>;
  getConsultantsByPreferences(
    location: LocationDto,
    profession: string,
    page: number,
    limit: number,
    sortBy?: "rating" | "hourlyRate" | "distance" // Sorting field
  ): Promise<{ consultants: ConsultantWithUserDetails[]; totalItems: number }>;
  save(consultant: Consultant): Promise<Consultant>;
}
