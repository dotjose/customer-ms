import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject, Logger } from "@nestjs/common";

import { GetNearbyConsultantsQuery } from "../get-nearby-consultants.query";
import { ConsultantRepository } from "domain/consultant/consultant.repository";
import { ConsultantSearchService } from "application/services/consultant-search.service";
import { ConsultantWithUserDetails } from "presentation/dtos/consultant.dto";
import { PaginatedResultDTO } from "presentation/dtos/common.dto";

@QueryHandler(GetNearbyConsultantsQuery)
export class GetNearbyConsultantsHandler
  implements IQueryHandler<GetNearbyConsultantsQuery>
{
  private readonly logger = new Logger(GetNearbyConsultantsHandler.name);

  constructor(
    @Inject("ConsultantRepository")
    private readonly consultantRepository: ConsultantRepository,
    private readonly consultantSearchService: ConsultantSearchService
  ) {}

  async execute(
    query: GetNearbyConsultantsQuery
  ): Promise<PaginatedResultDTO<ConsultantWithUserDetails[]>> {
    this.logger.log(
      `Executing GetNearbyConsultantsQuery with params: ${JSON.stringify(query.params)}`
    );

    const {
      location,
      radius,
      page = 1,
      limit = 20,
      profession,
      minRating,
      maxHourlyRate,
    } = query.params || {};

    let consultants: ConsultantWithUserDetails[];

    if (
      !location &&
      !radius &&
      !profession &&
      minRating === undefined &&
      maxHourlyRate === undefined
    ) {
      // No filters provided - Fetch all consultants with user details
      this.logger.log("No filters provided, fetching all consultants...");
      consultants = await this.consultantRepository.findAll();
    } else {
      // Filters provided - Search consultants
      const cacheKey = `nearby:${JSON.stringify(query.params)}`;

      let searchResults;
      try {
        this.logger.log(`Searching consultants based on filters...`);
        searchResults = await this.consultantSearchService.searchConsultants(
          { location, radius, profession, minRating, maxHourlyRate },
          cacheKey
        );
        this.logger.log(
          `Found ${searchResults.consultantIds.length} consultant IDs`
        );
      } catch (error) {
        this.logger.error("Error during consultant search", error.stack);
        throw new Error("Error during consultant search");
      }

      if (
        !searchResults.consultantIds ||
        searchResults.consultantIds.length === 0
      ) {
        this.logger.warn("No consultants found for the given query.");
        return { items: [], total: 0, page, limit, totalPages: 0 };
      }

      // Fetch consultant details by IDs with user details
      this.logger.log(`Fetching consultant details by IDs...`);
      consultants = await this.consultantRepository.findByIds(
        searchResults.consultantIds
      );
    }

    this.logger.log(`Fetched ${consultants.length} consultants`);

    // Paginate the results
    this.logger.log(`Paginating results...`);
    const paginatedResults = this.paginateResults(consultants, page, limit);
    this.logger.log(`Returning page ${page} of consultants`);

    return paginatedResults;
  }

  private paginateResults(consultants: any[], page: number, limit: number) {
    const totalPages = Math.ceil(consultants.length / limit);
    this.logger.debug(`Total pages: ${totalPages}`);
    return {
      items: consultants.slice((page - 1) * limit, page * limit),
      total: consultants.length,
      page,
      limit,
      totalPages,
    };
  }
}
