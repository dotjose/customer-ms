import { Injectable } from "@nestjs/common";
import { ElasticsearchService } from "infrastructure/services/elasticsearch.service";
import { RedisService } from "infrastructure/services/redis.service";

@Injectable()
export class ConsultantSearchService {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly redisService: RedisService
  ) {}

  async searchConsultants(queryParams: any, cacheKey: string): Promise<any> {
    // Step 1: Check cache
    const cachedResult = await this.getCachedResults(cacheKey);
    if (cachedResult) return cachedResult;

    // Step 2: Fetch results from Elasticsearch
    const esQuery =
      this.elasticsearchService.buildConsultantSearchQuery(queryParams);
    const searchResults = await this.elasticsearchService.search(
      "consultants",
      esQuery
    );

    const consultantIds = searchResults.hits.hits.map((hit) => hit._id);
    const totalHits =
      typeof searchResults.hits.total === "number"
        ? searchResults.hits.total
        : searchResults.hits.total.value;

    // Step 3: Cache and return results
    const result = { consultantIds, total: totalHits };
    await this.cacheResults(cacheKey, result);
    return result;
  }

  async getCachedResults(cacheKey: string): Promise<any> {
    try {
      const cachedData = await this.redisService.get(cacheKey);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      console.error(`Error retrieving cache for key ${cacheKey}:`, error);
      return null; // Avoid crashing if Redis fails
    }
  }

  async cacheResults(
    cacheKey: string,
    results: any,
    ttl: number = 300
  ): Promise<void> {
    try {
      await this.redisService.set(cacheKey, JSON.stringify(results), ttl);
    } catch (error) {
      console.error(`Error caching results for key ${cacheKey}:`, error);
    }
  }
}
