import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { UserDocument } from "infrastructure/persistence/mongodb/schemas/user.schema";
import { User } from "domain/user/user.entity";
import { UserRepository, UserPlatformStats } from "domain/user/user.repository";
import { UserResponseDto } from "presentation/dtos/auth.dto";
import { UserMapper } from "infrastructure/mappers/user.mapper";

@Injectable()
export class MongoUserRepository implements UserRepository {
  constructor(
    @InjectModel(UserDocument.name)
    private readonly userModel: Model<UserDocument>
  ) { }

  async findByEmailAndPhone(
    email: string,
    phone: string
  ): Promise<User | null> {
    const user = await this.userModel
      .findOne({ email, phoneNumber: phone })
      .exec();
    return user ? this.toEntity(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const cleanId = id.trim(); // Remove any unwanted whitespace/newline characters

    if (!Types.ObjectId.isValid(cleanId)) {
      return null;
    }

    const user = await this.userModel
      .findById(new Types.ObjectId(cleanId))
      .exec();

    return user ? this.toEntity(user) : null;
  }

  async findByEmailOrPhone(email: string): Promise<User | null> {
    const user = await this.userModel
      .findOne({ $or: [{ email }, { phoneNumber: email }] })
      .exec();
    return user ? this.toEntity(user) : null;
  }

  async findValidToken(token: string): Promise<User | null> {
    const user = await this.userModel
      .findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      })
      .exec();
    return user ? this.toEntity(user) : null;
  }

  async save(user: User): Promise<UserResponseDto> {
    const userObj = user.toObject();
    // Exclude _id from the update object (it's the query filter)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, location, ...otherFields } = userObj;

    const updateObj: any = {};

    // 1. Dynamically update all user fields (excluding location/undefined)
    Object.entries(otherFields).forEach(([key, value]) => {
      if (value !== undefined) {
        updateObj[key] = value;
      }
    });

    // 2. Handle Location Update Logic
    if (location) {
      const hasCoordinates =
        Array.isArray(location.coordinates) &&
        location.coordinates.length === 2 &&
        !location.coordinates.includes(NaN);

      // Only skip coordinates, not other fields
      const updatedLoc: any = {};

      if (hasCoordinates) updatedLoc.coordinates = location.coordinates;
      if (location.address) updatedLoc.address = location.address;
      if (location.city) updatedLoc.city = location.city;
      if (location.state) updatedLoc.state = location.state;
      if (location.country) updatedLoc.country = location.country;

      // Save location ONLY if we have at least 1 field
      if (Object.keys(updatedLoc).length > 0) updateObj.location = updatedLoc;
    }

    const userDoc = await this.userModel.findOneAndUpdate(
      { _id: user.id },
      { $set: updateObj },
      { upsert: true, new: true }
    );

    return UserMapper.toResponse(new User(userDoc.toObject(), userDoc._id));
  }

  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await this.userModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
  }

  async findAll(query: any): Promise<{ items: UserResponseDto[]; total: number }> {
    const { offset = 0, limit = 10, search = "", status, role } = query;
    const filter: any = {
      roles: { $ne: "ADMIN" }
    };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (status) filter.status = status;
    if (role) filter.roles = role;

    const [items, total] = await Promise.all([
      this.userModel.find(filter).skip(offset).limit(limit).sort({ createdAt: -1 }).exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map(doc => UserMapper.toResponse(this.toEntity(doc))),
      total,
    };
  }

  async getPlatformStats(): Promise<UserPlatformStats> {
    const filter = { roles: { $ne: "ADMIN" } };
    const [total, active, suspended, banned, blocked] = await Promise.all([
      this.userModel.countDocuments(filter).exec(),
      this.userModel.countDocuments({ ...filter, status: "ACTIVE" }).exec(),
      this.userModel.countDocuments({ ...filter, status: "SUSPENDED" }).exec(),
      this.userModel.countDocuments({ ...filter, status: "BANNED" }).exec(),
      this.userModel.countDocuments({ ...filter, status: "BLOCKED" }).exec(),
    ]);

    return {
      total,
      active,
      suspended,
      banned,
      blocked,
    };
  }

  private toEntity(doc: UserDocument): User {
    return new User(doc.toObject(), doc._id);
  }
}
