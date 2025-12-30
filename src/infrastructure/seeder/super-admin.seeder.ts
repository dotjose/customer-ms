import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ConfigService } from "@nestjs/config";
import { UserDocument } from "../persistence/mongodb/schemas/user.schema";
import { HashService } from "../services/hash.service";
import { UserStatus } from "domain/user/user.entity";

@Injectable()
export class SuperAdminSeeder {
  constructor(
    @InjectModel(UserDocument.name)
    private readonly userModel: Model<UserDocument>,
    private readonly hashService: HashService,
    private readonly configService: ConfigService
  ) {}

  async seed() {
    const email = this.configService.get<string>("SUPER_ADMIN_EMAIL");
    const phoneNumber = this.configService.get<string>("SUPER_ADMIN_PHONE");
    const fullName = this.configService.get<string>("SUPER_ADMIN_FULL_NAME") || "Super Admin";

    if (!email || !phoneNumber) {
      console.error("❌ Seeding failed: SUPER_ADMIN_EMAIL and SUPER_ADMIN_PHONE must be defined in ENV");
      return;
    }

    const existingAdmin = await this.userModel.findOne({ isSystemUser: true }).exec();
    if (existingAdmin) {
      console.log("ℹ️ Super Admin already exists. Skipping seeding.");
      return;
    }

    const [firstName, ...rest] = fullName.split(" ");
    const lastName = rest.join(" ") || "Admin";

    // Use a stable strong password if not provided in ENV
    const password = this.configService.get<string>("SUPER_ADMIN_PASSWORD") || "Habesha@Admin2025!";
    const hashedPassword = await this.hashService.hash(password);

    await this.userModel.create({
      email,
      phoneNumber,
      firstName,
      lastName,
      password: hashedPassword,
      roles: ["ADMIN"],
      status: UserStatus.ACTIVE,
      isSystemUser: true,
      isVerified: true,
    });

    console.log("✅ Super Admin created successfully!");
    console.log(`📧 Email: ${email}`);
    if (!this.configService.get<string>("SUPER_ADMIN_PASSWORD")) {
      console.log(`🔑 Temporary Password: ${password}`);
    }
  }
}
