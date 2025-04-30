import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { SearchConsultantsQuery } from "../search-consultants.query";
import { ConsultantRepository } from "domain/consultant/consultant.repository";
import { ConsultantSearchService } from "application/services/consultant-search.service";
import { OpenAIService } from "infrastructure/services/openai.service";
import { Inject, Logger } from "@nestjs/common";
import { LocationDto } from "presentation/dtos/auth.dto";
import { ConsultantWithUserDetails } from "presentation/dtos/consultant.dto";

@QueryHandler(SearchConsultantsQuery)
export class SearchConsultantsHandler implements IQueryHandler<SearchConsultantsQuery> {
  private readonly logger = new Logger(SearchConsultantsHandler.name);

  constructor(
    @Inject("ConsultantRepository")
    private readonly consultantRepository: ConsultantRepository,
    private readonly consultantSearchService: ConsultantSearchService,
    private readonly openAIService: OpenAIService
  ) {}

  async execute(query: SearchConsultantsQuery) {
    const { profession, page = 1, limit = 24, location } = query.params;
    const cacheKey = `search:${JSON.stringify(query)}`;

    try {
      const cached = await this.consultantSearchService.getCachedResults(cacheKey);
      if (cached) return cached;

      const {
        items: consultants,
        total,
        totalPages
      } = await this.consultantRepository.getConsultantsByPreferences(
        location,
        profession,
        Number(page),
        Number(limit),
        "distance"
      );

      const processed = total > 30
        ? await this.openAIService.rankConsultants(consultants.slice(0, 20), {
            profession,
            location,
            sortBy: "distance"
          })
        : consultants;

      const result = {
        items: processed,
        totalItems: total,
        page,
        limit,
        totalPages
      };

      await this.consultantSearchService.cacheResults(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`, error.stack);
      throw new Error("Consultant search failed.");
    }
  }
}
