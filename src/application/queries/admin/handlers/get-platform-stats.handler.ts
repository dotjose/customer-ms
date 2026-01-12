import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetPlatformStatsQuery } from "../get-platform-stats.query";
import { UserRepository, UserPlatformStats } from "domain/user/user.repository";
import { Inject } from "@nestjs/common";
import { RedisService } from "infrastructure/services/redis.service";

@QueryHandler(GetPlatformStatsQuery)
export class GetPlatformStatsHandler
  implements IQueryHandler<GetPlatformStatsQuery>
{
  private readonly CACHE_KEY = "stats:user-mss:platform";
  private readonly TTL = 60; // 60 seconds

  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService
  ) {}

  async execute(query: GetPlatformStatsQuery): Promise<UserPlatformStats> {
    const cachedStats = await this.redisService.get(this.CACHE_KEY);

    if (cachedStats) {
      return JSON.parse(cachedStats);
    }

    const stats = await this.userRepository.getPlatformStats();

    await this.redisService.set(this.CACHE_KEY, JSON.stringify(stats), this.TTL);

    return stats;
  }
}
