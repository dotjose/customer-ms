import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { UserDocument } from "../../persistence/mongodb/schemas/user.schema";
import { Admin } from "domain/admin/admin.entity";
import { AdminRepository } from "domain/admin/admin.repository";

@Injectable()
export class MongoAdminRepository implements AdminRepository {
  constructor(
    @InjectModel(UserDocument.name)
    private readonly adminModel: Model<UserDocument>
  ) {}

  async findById(id: string): Promise<Admin | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.adminModel.findOne({ _id: new Types.ObjectId(id), roles: "ADMIN" }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findByEmail(email: string): Promise<Admin | null> {
    const doc = await this.adminModel.findOne({ email, roles: "ADMIN" }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async save(admin: Admin): Promise<void> {
    const obj = admin.toObject();
    await this.adminModel.findOneAndUpdate(
      { _id: obj._id },
      { ...obj, roles: ["ADMIN"] },
      { upsert: true, new: true }
    );
  }

  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await this.adminModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
  }

  async findAll(query: any): Promise<{ items: Admin[]; total: number }> {
    const { offset = 0, limit = 10, search = "" } = query;
    const filter: any = { roles: "ADMIN" };
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.adminModel.find(filter).skip(offset).limit(limit).sort({ createdAt: -1 }).exec(),
      this.adminModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map(doc => this.toEntity(doc)),
      total,
    };
  }

  private toEntity(doc: UserDocument): Admin {
    const obj = doc.toObject();
    return new Admin({
      email: obj.email,
      firstName: obj.firstName,
      lastName: obj.lastName,
      phoneNumber: obj.phoneNumber,
      role: "ADMIN",
      status: obj.status,
      isSystemUser: obj.isSystemUser,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    }, doc._id);
  }
}
