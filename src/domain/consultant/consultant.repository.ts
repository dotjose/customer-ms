import { ConsultantWithUserDetails } from "presentation/dtos/consultant.dto";
import { Consultant } from "./consultant.entity";
import { LocationDto } from "presentation/dtos/auth.dto";
import { PaginatedResultDTO } from "presentation/dtos/common.dto";
import { Types } from "mongoose";

export interface ConsultantRepository {
  findById(id: string): Promise<Consultant | null>;
  getConsultantDetails(id: string): Promise<ConsultantWithUserDetails>;
  findAll(page: number, limit: number): Promise<{
    data: ConsultantWithUserDetails[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  findByIds(ids: string[]): Promise<ConsultantWithUserDetails[]>;
  findByUserId(id: string): Promise<Consultant | null>;
  getConsultantsByPreferences(
    location: LocationDto,
    profession: string,
    page: number,
    limit: number,
    sortBy?: "rating" | "hourlyRate" | "distance" // Sorting field
  ): Promise<PaginatedResultDTO<ConsultantWithUserDetails>>;
  removeUserFeedback(userId: string): Promise<Types.ObjectId[]>;
  save(consultant: Consultant): Promise<Consultant>;
}
