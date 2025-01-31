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
    const {
      profession,
      page = 1,
      limit = 20,
      location,
      sortBy = "distance",
    } = query.params;
    console.log(query);
    const cacheKey = `search:${JSON.stringify(query)}`;
    this.logger.log(`Executing SearchConsultantsQuery: ${cacheKey}`);

    try {
      // Step 1: Fetch consultants based on preferences
      const consultants = await this.fetchConsultants(
        { coordinates: [12.34, 56.78], address: "123 Main St" },
        profession
      );

      // Step 2: Handle small results (return early if fewer than 10 consultants)
      if (consultants.length < 10) {
        return {
          consultants,
          totalItems: consultants.length,
          page: 1,
          limit: consultants.length,
          totalPages: 1,
        };
      }

      // Step 3: Rank consultants using AI if we have more data to analyze
      const rankedConsultants = await this.rankConsultants(consultants, {
        profession,
        location: { coordinates: [12.34, 56.78], address: "123 Main St" },
        sortBy,
      });

      // Step 4: Paginate the ranked results
      const paginatedResults = this.paginateResults(
        rankedConsultants,
        page,
        limit
      );

      // Step 5: Cache results
      await this.cacheResults(cacheKey, paginatedResults);

      this.logger.log(`Returning paginated results for page ${page}`);
      return paginatedResults;
    } catch (error) {
      this.logger.error(
        `Error executing SearchConsultantsQuery: ${error.message}`,
        error.stack
      );
      throw new Error("An error occurred while processing the search query.");
    }
  }

  private async fetchConsultants(location: LocationDto, profession: string) {
    try {
      this.logger.log("Fetching consultants from the database...");
      const consultants =
        await this.consultantRepository.getConsultantsByPreferences(
          location,
          profession
        );
      this.logger.log(`Found ${consultants.length} consultants.`);
      return consultants;
    } catch (error) {
      this.logger.error(
        "Error fetching consultants from the database",
        error.stack
      );
      throw new Error("Failed to fetch consultants from the database.");
    }
  }

  private async rankConsultants(
    consultants: ConsultantWithUserDetails[],
    context: { profession: string; location: LocationDto; sortBy: string }
  ) {
    try {
      this.logger.log("Ranking consultants using AI...");
      const rankedConsultants = await this.openAIService.rankConsultants(
        consultants,
        context
      );
      this.logger.log(`AI ranked ${rankedConsultants.length} consultants.`);
      return rankedConsultants;
    } catch (error) {
      this.logger.error("Error during AI ranking of consultants", error.stack);
      throw new Error("Failed to rank consultants using AI.");
    }
  }

  private paginateResults(
    consultants: ConsultantWithUserDetails[],
    page: number,
    limit: number
  ) {
    const totalItems = consultants.length;
    const totalPages = Math.ceil(totalItems / limit);
    const items = consultants.slice((page - 1) * limit, page * limit);

    this.logger.debug(
      `Pagination - Page: ${page}, Limit: ${limit}, Total Pages: ${totalPages}`
    );
    return { items, totalItems, page, limit, totalPages };
  }

  private async cacheResults(cacheKey: string, results: any) {
    try {
      this.logger.log(`Caching results with key: ${cacheKey}`);
      await this.consultantSearchService.cacheResults(cacheKey, results);
    } catch (error) {
      this.logger.error("Error during result caching", error.stack);
      throw new Error("Failed to cache the search results.");
    }
  }
}
