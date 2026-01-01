import { Test, TestingModule } from '@nestjs/testing';
import { GetBulkViewCountsHandler } from './get-view-count.handler';
import { ViewTrackingRepository } from 'domain/view-tracking/view-tracking.repository';
import { ViewTrackingCacheService } from 'infrastructure/services/view-tracking-cache.service';
import { MetricsService } from 'infrastructure/monitoring/metrics.service';
import { GetBulkViewCountsQuery } from '../get-view-count.query';
import { EntityType } from 'domain/view-tracking/entity-type.enum';

describe('GetBulkViewCountsHandler', () => {
  let handler: GetBulkViewCountsHandler;

  const mockRepository: Pick<ViewTrackingRepository, 'getBulkViewCounts'> = {
    getBulkViewCounts: jest.fn(),
  } as any;

  const mockCacheService: Pick<ViewTrackingCacheService, 'getBulkViewCounts' | 'setBulkViewCounts'> = {
    getBulkViewCounts: jest.fn(),
    setBulkViewCounts: jest.fn(),
  } as any;

  const mockMetricsService: Pick<MetricsService, 'incrementCounter'> = {
    incrementCounter: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetBulkViewCountsHandler,
        {
          provide: 'ViewTrackingRepository',
          useValue: mockRepository,
        },
        {
          provide: ViewTrackingCacheService,
          useValue: mockCacheService,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    handler = module.get<GetBulkViewCountsHandler>(GetBulkViewCountsHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns deterministic results including all requested IDs with 0 defaults (mixed ID formats)', async () => {
    (mockCacheService.getBulkViewCounts as jest.Mock).mockResolvedValue(
      new Map<string, number>([["abc-123", 2]]),
    );

    (mockRepository.getBulkViewCounts as jest.Mock).mockResolvedValue(
      new Map<string, number>([["507f1f77bcf86cd799439011", 7]]),
    );

    const query = new GetBulkViewCountsQuery(EntityType.PRODUCT, [
      'abc-123',
      '507f1f77bcf86cd799439011',
      'missing-id',
    ]);

    const result = await handler.execute(query);

    expect(result.get('abc-123')).toBe(2);
    expect(result.get('507f1f77bcf86cd799439011')).toBe(7);
    expect(result.get('missing-id')).toBe(0);

    expect(mockRepository.getBulkViewCounts).toHaveBeenCalledWith(
      EntityType.PRODUCT,
      ['507f1f77bcf86cd799439011', 'missing-id'],
    );
  });

  it('preserves cached partial success when DB fetch fails', async () => {
    (mockCacheService.getBulkViewCounts as jest.Mock).mockResolvedValue(
      new Map<string, number>([["abc-123", 2]]),
    );

    (mockRepository.getBulkViewCounts as jest.Mock).mockRejectedValue(
      new Error('DB down'),
    );

    const query = new GetBulkViewCountsQuery(EntityType.PRODUCT, [
      'abc-123',
      'missing-id',
    ]);

    const result = await handler.execute(query);

    expect(result.get('abc-123')).toBe(2);
    expect(result.get('missing-id')).toBe(0);
  });

  it('falls back to DB fetch when cache fails and still returns deterministic defaults', async () => {
    (mockCacheService.getBulkViewCounts as jest.Mock).mockRejectedValue(
      new Error('Redis down'),
    );

    (mockRepository.getBulkViewCounts as jest.Mock).mockResolvedValue(
      new Map<string, number>([["abc-123", 9]]),
    );

    const query = new GetBulkViewCountsQuery(EntityType.PRODUCT, [
      'abc-123',
      'missing-id',
    ]);

    const result = await handler.execute(query);

    expect(result.get('abc-123')).toBe(9);
    expect(result.get('missing-id')).toBe(0);

    expect(mockRepository.getBulkViewCounts).toHaveBeenCalledWith(
      EntityType.PRODUCT,
      ['abc-123', 'missing-id'],
    );
  });
});
