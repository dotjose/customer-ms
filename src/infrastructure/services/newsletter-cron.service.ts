import { Injectable, Logger, Inject } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { NewsletterRepository } from "domain/newsletter/newsletter.repository";
import {
  NotificationTemplateService,
  NewsletterTemplateVars,
} from "./notification-template.service";
import { AWSConfigService } from "infrastructure/config/aws.config";
import {
  NewsletterTokenService,
  NewsletterTokenType,
} from "./newsletter-token.service";
import { ConsultantRepository } from "domain/consultant/consultant.repository";

@Injectable()
export class NewsletterCronService {
  private readonly logger = new Logger(NewsletterCronService.name);

  constructor(
    @Inject("NewsletterRepository")
    private readonly repository: NewsletterRepository,
    @Inject("ConsultantRepository")
    private readonly consultantRepository: ConsultantRepository,
    private readonly templateService: NotificationTemplateService,
    private readonly awsConfig: AWSConfigService,
    private readonly tokenService: NewsletterTokenService,
    private readonly configService: ConfigService
  ) { }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyNewsletter() {
    this.logger.log("Starting monthly newsletter distribution...");

    // 1. Fetch Data
    const newsletterData = await this.prepareNewsletterData();
    const hasData = [
      newsletterData.products,
      newsletterData.real_estate,
      newsletterData.jobs,
      newsletterData.news,
      newsletterData.professionals,
    ].some((list) => list && list.length > 0);

    if (!hasData) {
      this.logger.warn(
        "No newsletter content available. Aborting distribution."
      );
      return;
    }

    const subscribers = await this.repository.findAllSubscribed();
    this.logger.log(`Found ${subscribers.length} active subscribers.`);

    // 2. Group by Preferences
    const groups = new Map<string, typeof subscribers>();

    for (const sub of subscribers) {
      // Create a key based on preferences (e.g., "11111" for all true)
      // Default to all true if preferences missing
      const p = sub.preferences || {
        products: true,
        realestate: true,
        jobs: true,
        professionals: true,
        events: true,
      };
      const key = `${p.products ? "1" : "0"}${p.realestate ? "1" : "0"}${p.jobs ? "1" : "0"}${p.professionals ? "1" : "0"}${p.events ? "1" : "0"}`; // events maps to news/events

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(sub);
    }

    this.logger.log(`Created ${groups.size} preference groups.`);

    // 3. Process each group
    let successCount = 0;
    let failureCount = 0;
    const batchSize = 50;

    for (const [key, groupSubscribers] of groups) {
      // Decode key
      const showProducts = key[0] === "1";
      const showRealEstate = key[1] === "1";
      const showJobs = key[2] === "1";
      const showProfessionals = key[3] === "1";
      const showNews = key[4] === "1"; // Mapping events to news for now

      // Render Content ONCE for this group
      const groupVars: Partial<NewsletterTemplateVars> = {
        products: showProducts ? newsletterData.products : [],
        real_estate: showRealEstate ? newsletterData.real_estate : [],
        jobs: showJobs ? newsletterData.jobs : [],
        professionals: showProfessionals ? newsletterData.professionals : [],
        news: showNews ? newsletterData.news : [],
      };

      const contentHtml =
        this.templateService.renderNewsletterContent(groupVars);

      // 4. Send in Batches
      for (let i = 0; i < groupSubscribers.length; i += batchSize) {
        const batch = groupSubscribers.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (sub) => {
            try {
              const unsubscribeToken = await this.tokenService.generateToken(
                sub.email,
                NewsletterTokenType.UNSUBSCRIBE
              );
              const preferencesToken = await this.tokenService.generateToken(
                sub.email,
                NewsletterTokenType.PREFERENCES
              );

              const baseUrl =
                this.configService.get<string>("APP_BASE_URL") ||
                "https://habeshanetwork.com";
              // Check if user preferences endpoint matches implementation plan
              const preferences_url = `${baseUrl}/newsletter/preferences?token=${preferencesToken}`;
              const unsubscribe_url = `${baseUrl}/newsletter/unsubscribe?token=${unsubscribeToken}`;

              const userVars = {
                ...newsletterData, // For header/footer static data
                preferences_url,
                unsubscribe_url,
                current_year: new Date().getFullYear(),
              };

              const fullHtml = this.templateService.renderNewsletterWrapper(
                contentHtml,
                userVars
              );

              await this.awsConfig.sendEmail({
                Destination: { ToAddresses: [sub.email] },
                Message: {
                  Body: { Html: { Data: fullHtml, Charset: "UTF-8" } },
                  Subject: {
                    Data: "Habesha Network Monthly Newsletter",
                    Charset: "UTF-8",
                  },
                },
                Source: this.configService.get<string>("SUPPORT_EMAIL"),
              });
              successCount++;
            } catch (error) {
              this.logger.error(
                `Failed to send to ${sub.email}: ${error.message}`
              );
              failureCount++;
            }
          })
        );
      }
    }

    this.logger.log(
      `Detailed distribution complete. Success: ${successCount}, Failed: ${failureCount}`
    );
  }

  private async prepareNewsletterData(): Promise<
    Omit<
      NewsletterTemplateVars,
      "preferences_url" | "unsubscribe_url" | "current_year"
    >
  > {
    const BASE_API_URL = this.configService.get<string>("BASE_API_URL") ||
      "https://c3igf19tk2.execute-api.us-east-1.amazonaws.com";

    const baseUrl =
      this.configService.get<string>("APP_BASE_URL") ||
      "https://www.habeshanetwork.com";

    try {
      const [productsRes, realEstateRes, jobsRes, newsRes, consultantsRes] = await Promise.all([
        fetch(`${BASE_API_URL}/product-api/products/search?page=1&limit=3`)
          .then((res) => res.json())
          .catch(() => []),
        fetch(`${BASE_API_URL}/realstate-api/properties?page=1&limit=3`)
          .then((res) => res.json())
          .catch(() => []),
        fetch(`${BASE_API_URL}/job-api/jobs?page=1&limit=3`)
          .then((res) => res.json())
          .catch(() => []),
        fetch(`${BASE_API_URL}/post-api/posts/blogs?page=1&limit=3`)
          .then((res) => res.json())
          .catch(() => []),
        this.consultantRepository.getConsultantsByPreferences(null, null, 1, 3, "rating").then(res => res.items).catch(() => [])
      ]);

      return {
        logo_url:
          "https://meeting-bota-assets.s3.us-east-1.amazonaws.com/logo_vectorized.svg",
        tagline: "Your community marketplace & network",
        hero_title: "Explore the Best of Habesha Network",
        hero_description: "Your monthly roundup of premium deals, career moves, and community highlights is here.",
        hero_link: baseUrl,
        products: (productsRes?.data?.items || productsRes || [])
          .map((item) =>
            this.normalizeNewsletterItem(item, "Products", baseUrl)
          ),
        real_estate: (realEstateRes?.data?.items || realEstateRes || [])
          .map((item) =>
            this.normalizeNewsletterItem(item, "Real Estate", baseUrl)
          ),
        jobs: (jobsRes?.data?.items || jobsRes || [])
          .map((item) => this.normalizeNewsletterItem(item, "Jobs", baseUrl)),
        news: (newsRes?.data?.items || newsRes || [])
          .map((item) =>
            this.normalizeNewsletterItem(item, "Community News", baseUrl)
          ),
        professionals: (consultantsRes || [])
          .slice(0, 3)
          .map((item) =>
            this.normalizeNewsletterItem(item, "Professionals", baseUrl)
          ),
        facebook_url:
          "https://web.facebook.com/profile.php?id=61580206130872&mibextid=wwXIfr&rdid=d3D8RRococHd8yrA&share_url=https%3A%2F%2Fweb.facebook.com%2Fshare%2F1A8A6RoiUN%2F%3Fmibextid%3DwwXIfr%26ref%3Dwaios.fb_links_xma_control%26_rdc%3D1%26_rdr",
        tiktok_url:
          "https://www.tiktok.com/@habeshanetwork?_r=1&_t=ZT-92AXXvMwbYt",
        instagram_url: "https://www.instagram.com/yehabeshanetwork",
        company_address: "Lavon, TX 75166, USA",
        contact_email: "support@habeshanetwork.com",
        contact_phone: "+1 (855) 553-7873",
      };
    } catch (error) {
      this.logger.error(`Failed to fetch newsletter data: ${error.message}`);
      return this.getFallbackData();
    }
  }

  private normalizeNewsletterItem(
    item: any,
    category: string,
    baseUrl: string
  ): any {
    const id = item.id || item._id;
    let link = `${baseUrl}/explore`;

    // Category specific links
    if (category === "Products") link = `${baseUrl}/product/${id}`;
    if (category === "Real Estate") link = `${baseUrl}/property/${id}`;
    if (category === "Jobs") link = `${baseUrl}/job/${id}`;
    if (category === "Community News") link = `${baseUrl}/story/${id}`;
    if (category === "Professionals") link = `${baseUrl}/consultant/${id}`;

    // Price detection
    let priceDisplay = "Contact for details";
    const price = item.price || item.salary || item.rent || item.rate;
    if (price) {
      const formatted =
        typeof price === "number"
          ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(price)
          : price;
      priceDisplay = formatted.toString();
    }

    return {
      id,
      title:
        item.title ||
        item.name ||
        item.position ||
        item.business ||
        "Premium Listing",
      category,
      location:
        item?.location?.state ||
        item?.user?.location?.state ||
        item?.location?.address,
      price: priceDisplay,
      image:
        item.featuredImage?.url ??
        item.featuredImage ??
        item?.user?.avatar ??
        (Array.isArray(item.images) ? item.images[0] : null) ??
        (Array.isArray(item.featureImg) ? item.featureImg[0] : null) ??
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
      link,
    };
  }

  private getFallbackData() {
    return {
      logo_url:
        "https://meeting-bota-assets.s3.us-east-1.amazonaws.com/logo_vectorized.svg",
      tagline: "Your community marketplace & network",
      hero_image_url: "https://habeshanetwork.com/hero.jpg",
      hero_title: "Explore the Best of Habesha Network",
      hero_description: "Your monthly roundup of premium deals, career moves, and community highlights is here.",
      hero_link: "https://habeshanetwork.com",
      products: [],
      real_estate: [],
      jobs: [],
      professionals: [],
      news: [],
      facebook_url:
        "https://web.facebook.com/profile.php?id=61580206130872&mibextid=wwXIfr&rdid=d3D8RRococHd8yrA&share_url=https%3A%2F%2Fweb.facebook.com%2Fshare%2F1A8A6RoiUN%2F%3Fmibextid%3DwwXIfr%26ref%3Dwaios.fb_links_xma_control%26_rdc%3D1%26_rdr",
      tiktok_url:
        "https://www.tiktok.com/@habeshanetwork?_r=1&_t=ZT-92AXXvMwbYt",
      instagram_url: "https://www.instagram.com/yehabeshanetwork",
      linkedin_url: "#",
      company_address: "Lavon, TX 75166, USA",
      contact_email: "support@habeshanetwork.com",
      contact_phone: "+1 (855) 553-7873",
    };
  }
}
