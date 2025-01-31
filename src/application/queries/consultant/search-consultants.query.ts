import { IQuery } from "@nestjs/cqrs";

export interface SearchConsultantsParams {
  profession?: string; // Filter by profession
  skills?: string[]; // Filter by specific skills
  location?: {
    type?: "Point"; // Geospatial type
    coordinates?: [number, number]; // [longitude, latitude]
    address?: string; // Optional address
  };
  minRating?: number; // Minimum average rating
  maxHourlyRate?: number; // Maximum hourly rate
  page?: number; // Pagination: page number
  limit?: number; // Pagination: number of results per page
  sortBy?: "rating" | "hourlyRate" | "distance"; // Sorting field
  sortOrder?: "asc" | "desc"; // Sorting order
}

export class SearchConsultantsQuery implements IQuery {
  constructor(public readonly params: SearchConsultantsParams) {}
}
