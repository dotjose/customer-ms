import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { SearchConsultantsQuery } from "../search-consultants.query";
import { ConsultantWithUserDetails } from "presentation/dtos/consultant.dto";
import { ConsultantRepository } from "domain/consultant/consultant.repository";
import { ConsultantSearchService } from "application/services/consultant-search.service";
import { OpenAIService } from "infrastructure/services/openai.service";
import { Inject, Logger } from "@nestjs/common";
import { LocationDto } from "presentation/dtos/auth.dto";

@QueryHandler(SearchConsultantsQuery)
export class SearchConsultantsHandler
  implements IQueryHandler<SearchConsultantsQuery>
{
  private readonly logger = new Logger(SearchConsultantsHandler.name);

  constructor(
    @Inject("ConsultantRepository")
    private readonly consultantRepository: ConsultantRepository,
    private readonly consultantSearchService: ConsultantSearchService,
    private readonly openAIService: OpenAIService
  ) {}

  async execute(query: SearchConsultantsQuery) {
    const { profession, page = 1, limit = 20, location } = query.params;
    const cacheKey = `search:${JSON.stringify(query)}`;
    this.logger.log(`Executing SearchConsultantsQuery: ${cacheKey}`);

    try {
      // Check Cache
      const cachedResults =
        await this.consultantSearchService.getCachedResults(cacheKey);
      if (cachedResults) return cachedResults;

      // Fetch consultants sorted by distance
      const { consultants, totalItems } = await this.fetchConsultants(
        location,
        profession,
        page,
        limit
      );

      // Apply AI ranking only if more than 30 results exist, process only first 20
      const processedConsultants =
        totalItems > 30
          ? await this.rankConsultants(consultants.slice(0, 20), {
              profession,
              location,
              sortBy: "distance",
            })
          : consultants;

      const result = {
        items: processedConsultants,
        totalItems,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit),
      };
      await this.cacheResults(cacheKey, result);

      return result;
    } catch (error) {
      this.logger.error(
        `Error executing SearchConsultantsQuery: ${error.message}`,
        error.stack
      );
      throw new Error("An error occurred while processing the search query.");
    }
  }

  private async fetchConsultants(
    location: LocationDto,
    profession: string,
    page: number,
    limit: number
  ) {
    try {
      this.logger.log("Fetching consultants sorted by distance...");
      return this.consultantRepository.getConsultantsByPreferences(
        location,
        profession,
        page,
        limit,
        "distance"
      );
    } catch (error) {
      this.logger.error("Error fetching consultants", error.stack);
      throw new Error("Failed to fetch consultants.");
    }
  }

  private async rankConsultants(
    consultants: ConsultantWithUserDetails[],
    context: { profession: string; location: LocationDto; sortBy: string }
  ) {
    try {
      this.logger.log("Applying AI ranking on first 20 consultants...");
      return this.openAIService.rankConsultants(consultants, { ...context });
    } catch (error) {
      this.logger.error("Error during AI ranking", error.stack);
      throw new Error("Failed to rank consultants using AI.");
    }
  }

  private async cacheResults(cacheKey: string, results: any) {
    try {
      this.logger.log(`Caching results: ${cacheKey}`);
      await this.consultantSearchService.cacheResults(cacheKey, results);
    } catch (error) {
      this.logger.error("Error during result caching", error.stack);
      throw new Error("Failed to cache search results.");
    }
  }
}
