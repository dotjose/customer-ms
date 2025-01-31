import { IQuery } from "@nestjs/cqrs";
import { LocationDto } from "presentation/dtos/auth.dto";

export interface GetNearbyConsultantsParams {
  location?: LocationDto;
  radius?: number;
  page?: number;
  limit?: number;
  profession?: string;
  minRating?: number;
  maxHourlyRate?: number;
}

export class GetNearbyConsultantsQuery implements IQuery {
  constructor(public readonly params: GetNearbyConsultantsParams) {}
}
