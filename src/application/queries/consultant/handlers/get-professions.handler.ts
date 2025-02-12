import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Logger } from "@nestjs/common";
import { Cache } from "cache-manager";

import { GetProfessionsQuery } from "../get-professions.query";
import { ProfessionRepository } from "domain/consultant/profession.repositorty";

@QueryHandler(GetProfessionsQuery)
export class GetProfessionsHandler
  implements IQueryHandler<GetProfessionsQuery>
{
  private readonly logger = new Logger(GetProfessionsHandler.name);
  private readonly CACHE_TTL = 3600; // 1 hour cache

  constructor(
    @Inject("ProfessionRepository")
    private readonly professionRepository: ProfessionRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  async execute(query: GetProfessionsQuery) {
    this.logger.log(`Fetching all professions...`);

    const cacheKey = `professions:all`;

    try {
      // ✅ Check Cache First
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit: Returning cached professions`);
        return cached;
      }

      // ✅ Fetch from Repository
      const professions = await this.professionRepository.listProfessions();
      if (!professions) {
        this.logger.warn(`No professions found in repository`);
        return [];
      }

      // ✅ Store in Cache
      await this.cacheManager.set(cacheKey, professions, this.CACHE_TTL);
      this.logger.log(`Professions cached for ${this.CACHE_TTL} seconds`);

      return professions;
    } catch (error) {
      this.logger.error(
        `Failed to fetch professions: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
