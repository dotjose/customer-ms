import { Test, TestingModule } from '@nestjs/testing';
import { IncrementViewHandler } from './increment-view.handler';
import { ViewTrackingRepository } from 'domain/view-tracking/view-tracking.repository';
import { MetricsService } from 'infrastructure/monitoring/metrics.service';
import { BotDetectionService } from 'infrastructure/services/bot-detection.service';
import { IncrementViewCommand } from '../increment-view.command';
import { EntityType } from 'domain/view-tracking/entity-type.enum';
import { ObjectId } from 'mongodb';

describe('IncrementViewHandler', () => {
  let handler: IncrementViewHandler;
  let repository: ViewTrackingRepository;
  let botDetectionService: BotDetectionService;
  let metricsService: MetricsService;

  const mockRepository = {
    incrementViewCount: jest.fn(),
    getViewCount: jest.fn(),
  };

  const mockBotDetectionService = {
    isBot: jest.fn(),
    isDuplicateView: jest.fn(),
    recordView: jest.fn(),
  };

  const mockMetricsService = {
    incrementCounter: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncrementViewHandler,
        {
          provide: 'ViewTrackingRepository',
          useValue: mockRepository,
        },
        {
          provide: BotDetectionService,
          useValue: mockBotDetectionService,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    handler = module.get<IncrementViewHandler>(IncrementViewHandler);
    repository = module.get<ViewTrackingRepository>('ViewTrackingRepository');
    botDetectionService = module.get<BotDetectionService>(BotDetectionService);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should increment view count when request is valid', async () => {
    const command = new IncrementViewCommand(
      EntityType.PRODUCT,
      new ObjectId().toHexString(),
      '127.0.0.1',
      'Mozilla/5.0',
    );

    mockBotDetectionService.isBot.mockResolvedValue(false);
    mockBotDetectionService.isDuplicateView.mockResolvedValue(false);
    mockRepository.incrementViewCount.mockResolvedValue(10);

    const result = await handler.execute(command);

    expect(result).toBe(10);
    expect(mockBotDetectionService.isBot).toHaveBeenCalledWith(
      command.clientIp,
      command.userAgent,
    );
    expect(mockBotDetectionService.isDuplicateView).toHaveBeenCalledWith(
      command.clientIp,
      command.entityType,
      command.listingId,
    );
    expect(mockRepository.incrementViewCount).toHaveBeenCalledWith(
      command.entityType,
      command.listingId,
      command.clientIp, // Updated signature verification
    );
    expect(mockBotDetectionService.recordView).toHaveBeenCalled();
    expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
      'view_tracking.increment_success',
      expect.any(Object),
    );
  });

  it('should throw error if bot is detected', async () => {
    const command = new IncrementViewCommand(
      EntityType.PRODUCT,
      new ObjectId().toHexString(),
      '127.0.0.1',
      'Bot/1.0',
    );

    mockBotDetectionService.isBot.mockResolvedValue(true);

    // The handler catches errors and returns fallback, but internally it throws 'Bot traffic detected'
    // Let's verify it calls fallback logic (getViewCount) or returns 0.
    // Looking at the code: catch block logs error, increments metric, and tries repository.getViewCount.
    mockRepository.getViewCount.mockResolvedValue(5);

    const result = await handler.execute(command);

    expect(mockBotDetectionService.isBot).toHaveBeenCalled();
    expect(mockRepository.incrementViewCount).not.toHaveBeenCalled();
    expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
      'view_tracking.bot_blocked',
    );
    // It enters catch block -> metrics.incrementCounter('view_tracking.increment_error') -> repository.getViewCount
    expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
      'view_tracking.increment_error',
      expect.any(Object),
    );
    expect(result).toBe(5);
  });

  it('should return current count without incrementing if duplicate view', async () => {
    const command = new IncrementViewCommand(
      EntityType.PRODUCT,
      new ObjectId().toHexString(),
      '127.0.0.1',
      'Mozilla/5.0',
    );

    mockBotDetectionService.isBot.mockResolvedValue(false);
    mockBotDetectionService.isDuplicateView.mockResolvedValue(true);
    mockRepository.getViewCount.mockResolvedValue(20);

    const result = await handler.execute(command);

    expect(result).toBe(20);
    expect(mockRepository.incrementViewCount).not.toHaveBeenCalled();
    expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
      'view_tracking.duplicate_blocked',
    );
    expect(mockRepository.getViewCount).toHaveBeenCalled();
  });
});
