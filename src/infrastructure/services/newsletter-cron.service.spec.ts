import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { NewsletterCronService } from "./newsletter-cron.service";
import { NotificationTemplateService } from "./notification-template.service";
import { AWSConfigService } from "infrastructure/config/aws.config";
import { NewsletterTokenService } from "./newsletter-token.service";

describe("NewsletterCronService", () => {
  let service: NewsletterCronService;
  let repositoryMock: any;
  let templateServiceMock: any;
  let awsConfigMock: any;
  let tokenServiceMock: any;
  let configServiceMock: any;
  let consultantRepositoryMock: any;

  beforeEach(async () => {
    repositoryMock = {
      findAllSubscribed: jest.fn(),
    };
    templateServiceMock = {
      renderNewsletterContent: jest.fn().mockReturnValue("<div>Content</div>"),
      renderNewsletterWrapper: jest.fn().mockReturnValue("<html>Wrapper</html>"),
    };
    awsConfigMock = {
      sendEmail: jest.fn().mockResolvedValue({}),
    };
    tokenServiceMock = {
      generateToken: jest.fn().mockResolvedValue("mock-token"),
    };
    configServiceMock = {
      get: jest.fn((key) => {
        if (key === "APP_BASE_URL") return "http://test.com";
        if (key === "SUPPORT_EMAIL") return "support@test.com";
        return null;
      }),
    };
    consultantRepositoryMock = {
      getConsultantsByPreferences: jest.fn().mockResolvedValue({ items: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsletterCronService,
        { provide: "NewsletterRepository", useValue: repositoryMock },
        { provide: NotificationTemplateService, useValue: templateServiceMock },
        { provide: AWSConfigService, useValue: awsConfigMock },
        { provide: NewsletterTokenService, useValue: tokenServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: "ConsultantRepository", useValue: consultantRepositoryMock },
      ],
    }).compile();

    service = module.get<NewsletterCronService>(NewsletterCronService);
    // Spy on private/protected methods if needed via prototype or using any cast
    jest.spyOn(service as any, 'prepareNewsletterData').mockResolvedValue({
      products: [{ id: '1', title: 'P1' }],
      real_estate: [],
      jobs: [],
      news: [],
      professionals: []
    });
  });

  it("should define service", () => {
    expect(service).toBeDefined();
  });

  it("should abort if no data available", async () => {
    jest.spyOn(service as any, 'prepareNewsletterData').mockResolvedValue({
      products: [], real_estate: [], jobs: [], news: [], professionals: []
    });

    await service.handleMonthlyNewsletter();

    expect(repositoryMock.findAllSubscribed).not.toHaveBeenCalled();
    expect(awsConfigMock.sendEmail).not.toHaveBeenCalled();
  });

  it("should send emails to subscribers grouped by preferences", async () => {
    const sub1 = { 
      email: "user1@test.com", 
      preferences: { products: true, realestate: false, jobs: false, professionals: false, events: false } 
    };
    const sub2 = { 
      email: "user2@test.com", 
      preferences: { products: true, realestate: false, jobs: false, professionals: false, events: false } 
    };
    const sub3 = { 
      email: "user3@test.com", 
      preferences: { products: false, realestate: true, jobs: false, professionals: false, events: false } 
    };

    repositoryMock.findAllSubscribed.mockResolvedValue([sub1, sub2, sub3]);

    await service.handleMonthlyNewsletter();

    // products=true group (2 users) => 1 content render call
    // products=false group (1 user) => 1 content render call
    expect(templateServiceMock.renderNewsletterContent).toHaveBeenCalledTimes(2);
    
    // Total emails sent = 3
    expect(awsConfigMock.sendEmail).toHaveBeenCalledTimes(3);

    // Check grouping logic via args
    const firstCallArgs = templateServiceMock.renderNewsletterContent.mock.calls[0][0];
    const secondCallArgs = templateServiceMock.renderNewsletterContent.mock.calls[1][0];

    // One call should have products data, other should not (depending on iteration order)
    const callsWithProducts = [firstCallArgs, secondCallArgs].filter(args => args.products && args.products.length > 0);
    expect(callsWithProducts.length).toBe(1);
  });
});
