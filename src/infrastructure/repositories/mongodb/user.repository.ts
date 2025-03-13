import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { UserDocument } from "../../persistence/mongodb/schemas/user.schema";
import { User } from "domain/user/user.entity";
import { UserRepository } from "domain/user/user.repository";
import { UserResponseDto } from "presentation/dtos/auth.dto";
import { UserMapper } from "infrastructure/mappers/user.mapper";

@Injectable()
export class MongoUserRepository implements UserRepository {
  constructor(
    @InjectModel(UserDocument.name)
    private readonly userModel: Model<UserDocument>
  ) {}

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
    // Convert the user entity to a plain object
    const userObj = user.toObject();
    // Create a shallow copy and exclude invalid location data
    const transformedUserObj = {
      ...userObj,
      ...(userObj.location?.coordinates?.length ? {} : { location: undefined }),
    };
    const userDoc = await this.userModel.findOneAndUpdate(
      { _id: user.id },
      transformedUserObj,
      { upsert: true, new: true }
    );
    return UserMapper.toResponse(new User(userDoc.toObject(), userDoc._id));
  }

  private toEntity(doc: UserDocument): User {
    return new User(doc.toObject(), doc._id);
  }
}
