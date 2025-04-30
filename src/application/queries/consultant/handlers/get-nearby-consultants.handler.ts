import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject, Logger } from "@nestjs/common";
import { ConsultantRepository } from "domain/consultant/consultant.repository";
import { PaginatedResultDTO } from "presentation/dtos/common.dto";
import { ConsultantWithUserDetails } from "presentation/dtos/consultant.dto";
import { GetNearbyConsultantsQuery } from "../get-nearby-consultants.query";

@QueryHandler(GetNearbyConsultantsQuery)
export class GetNearbyConsultantsHandler implements IQueryHandler<GetNearbyConsultantsQuery> {
  private readonly logger = new Logger(GetNearbyConsultantsHandler.name);

  constructor(
    @Inject("ConsultantRepository")
    private readonly consultantRepository: ConsultantRepository,
  ) {}

  async execute(query: GetNearbyConsultantsQuery): Promise<PaginatedResultDTO<ConsultantWithUserDetails>> {
    try {
      this.logger.log(`Executing with params: ${JSON.stringify(query.params)}`);
       const { page, limit } = query.params || {};
        this.logger.log("Fetching all consultants with pagination");
        const formattedPage = Number(page ?? 1);
        const formattedLimit = Number(limit ?? 24);
        const res = await this.consultantRepository.findAll(formattedPage, formattedLimit);
        return {
          items: res.data,
          total: res.total,
          page: Number(page),
          limit: Number(limit),
          totalPages:res.totalPages,
        }
    } catch (error) {
      this.logger.error(`Handler failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}