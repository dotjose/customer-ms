import { Injectable } from "@nestjs/common";
import { Client } from "@elastic/elasticsearch";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ElasticsearchService {
  private readonly client: Client;

  constructor(private readonly configService: ConfigService) {
    this.client = new Client({
      node: this.configService.get<string>("ELASTICSEARCH_URL"),
    });
  }

  async buildConsultantSearchQuery(params: any) {
    const { profession, skills, location, minRating, maxHourlyRate } = params;

    const must = [];

    if (profession) {
      must.push({ match: { profession } });
    }

    if (skills?.length) {
      must.push({ terms: { skills } });
    }

    if (minRating) {
      must.push({ range: { averageRating: { gte: minRating } } });
    }

    if (maxHourlyRate) {
      must.push({ range: { hourlyRate: { lte: maxHourlyRate } } });
    }

    if (location) {
      must.push({
        geo_distance: {
          distance: `${location.maxDistance || 10}km`,
          location: {
            lat: location.latitude,
            lon: location.longitude,
          },
        },
      });
    }

    return {
      query: {
        bool: { must },
      },
      sort: [
        { _score: { order: "desc" } },
        { averageRating: { order: "desc" } },
      ],
    };
  }

  async search(index: string, query: any) {
    return this.client.search({
      index,
      body: query,
    });
  }

  // New: Update Method
  async update(index: string, id: string, doc: any) {
    return this.client.update({
      index,
      id,
      body: {
        doc,
      },
    });
  }
}
