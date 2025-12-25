import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ConsultantDocument } from "infrastructure/persistence/mongodb/schemas/consultant.schema";
import { UserDocument } from "infrastructure/persistence/mongodb/schemas/user.schema";
import { NewsletterSubscriberDocument } from "infrastructure/persistence/mongodb/schemas/newsletter.schema";
import { Model } from "mongoose";

@Injectable()
export class DatabaseService {
  constructor(
    @InjectModel(UserDocument.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(ConsultantDocument.name)
    private readonly consultantModel: Model<ConsultantDocument>,
    @InjectModel(NewsletterSubscriberDocument.name)
    private readonly newsletterModel: Model<NewsletterSubscriberDocument>
  ) {}

  async syncIndexes() {
    // Sync indexes for each model
    await this.userModel.syncIndexes();
    await this.consultantModel.syncIndexes();
    await this.newsletterModel.syncIndexes();
  }
}
