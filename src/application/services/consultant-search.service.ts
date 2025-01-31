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
    // Check cache
    const cachedResult = await this.redisService.get(cacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    // Build Elasticsearch query
    const esQuery =
      this.elasticsearchService.buildConsultantSearchQuery(queryParams);

    // Fetch results from Elasticsearch
    const searchResults = await this.elasticsearchService.search(
      "consultants",
      esQuery
    );
    const consultantIds = searchResults.hits.hits.map((hit) => hit._id);

    // Handle `hits.total` as a number or an object
    const totalHits =
      typeof searchResults.hits.total === "number"
        ? searchResults.hits.total
        : searchResults.hits.total.value;

    // Return results
    return { consultantIds, total: totalHits };
  }

  async cacheResults(
    cacheKey: string,
    results: any,
    ttl: number = 300
  ): Promise<void> {
    await this.redisService.set(cacheKey, JSON.stringify(results), ttl);
  }
}
