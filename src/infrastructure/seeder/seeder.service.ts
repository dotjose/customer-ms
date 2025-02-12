import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import * as professions from "./data/professions.json";
import { ProfessionDocument } from "infrastructure/repositories/mongodb/profession.repository";

@Injectable()
export class SeederService {
  constructor(
    @InjectModel(ProfessionDocument.name)
    private readonly professionModel: Model<ProfessionDocument>
  ) {}

  async seed() {
    try {
      await this.seedProfessions();
      console.log("Seeding completed successfully");
    } catch (error) {
      console.error("Seeding failed:", error);
      throw error;
    }
  }

  private async seedProfessions() {
    const existingCount = await this.professionModel.countDocuments();
    if (existingCount === 0) {
      await this.professionModel.insertMany(professions.professions);
      console.log("Professions seeded successfully");
    }
  }
}
