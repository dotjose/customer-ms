import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ConsultantDocument } from "../../persistence/mongodb/schemas/consultant.schema";
import { Consultant } from "domain/consultant/consultant.entity";
import { ConsultantRepository } from "domain/consultant/consultant.repository";
import { ConsultantWithUserDetails } from "presentation/dtos/consultant.dto";
import { LocationDto } from "presentation/dtos/auth.dto";

@Injectable()
export class MongoConsultantRepository implements ConsultantRepository {
  constructor(
    @InjectModel(ConsultantDocument.name)
    private readonly consultantModel: Model<ConsultantDocument>
  ) {}
  async getConsultantDetails(id: string): Promise<ConsultantWithUserDetails> {
    const consultantDetails = await this.consultantModel
      .aggregate([
        {
          $match: {
            _id: new Types.ObjectId(id), // Match the specific consultant by ID
          },
        },
        {
          $lookup: {
            from: "users", // Lookup user details from the "users" collection
            localField: "userId",
            foreignField: "_id",
            as: "userDetails", // Name the field that will contain user data
          },
        },
        {
          $unwind: {
            path: "$userDetails", // Flatten the userDetails array
            preserveNullAndEmptyArrays: true, // Keep consultant even if userDetails is null
          },
        },
        {
          $project: {
            id: "$_id", // Rename _id to id
            profession: 1,
            skills: 1,
            hourlyRate: 1,
            averageRating: 1,
            totalReviews: 1,
            isAvailable: 1,
            createdAt: 1,
            updatedAt: 1,
            "user.fullName": { $ifNull: ["$userDetails.fullName", "N/A"] },
            "user.email": { $ifNull: ["$userDetails.email", "N/A"] },
            "user.phone": { $ifNull: ["$userDetails.phoneNumber", "N/A"] },
            "user.location": { $ifNull: ["$userDetails.location", "N/A"] },
            reviews: { $slice: ["$reviews", 20] }, // Limit reviews to 20
          },
        },
      ])
      .exec();

    return consultantDetails[0];
  }

  async findById(id: string): Promise<Consultant | null> {
    const cleanId = id.trim();

    if (!Types.ObjectId.isValid(cleanId)) {
      return null;
    }

    const consultant = await this.consultantModel
      .findOne({ _id: new Types.ObjectId(cleanId) })
      .exec();

    return consultant ? this.toEntity(consultant) : null;
  }

  async findByIds(
    consultantIds: string[]
  ): Promise<ConsultantWithUserDetails[]> {
    return this.consultantModel
      .aggregate([
        {
          $match: {
            isAvailable: true, // Only include available consultants
            _id: { $in: consultantIds }, // Match consultants by provided IDs
          },
        },
        {
          $lookup: {
            from: "users", // Assuming "users" is the name of the user collection
            localField: "userId", // Local field to join with the user collection
            foreignField: "_id", // Foreign field to match the local field
            as: "userDetails", // The field in the resulting document to hold user details
          },
        },
        {
          $unwind: {
            path: "$userDetails", // Flatten the user details array
            preserveNullAndEmptyArrays: true, // Keep consultants even if userDetails are missing
          },
        },
        {
          $project: {
            id: "$_id", // Rename _id to id
            profession: 1,
            skills: 1,
            hourlyRate: 1,
            averageRating: 1,
            totalReviews: 1,
            isAvailable: 1,
            createdAt: 1,
            updatedAt: 1,
            "user.fullName": { $ifNull: ["$userDetails.fullName", "N/A"] },
            "user.email": { $ifNull: ["$userDetails.email", "N/A"] },
            "user.phone": { $ifNull: ["$userDetails.phoneNumber", "N/A"] },
            "user.location": { $ifNull: ["$userDetails.location", "N/A"] },
          },
        },
      ])
      .exec();
  }

  async findByUserId(id: string): Promise<Consultant | null> {
    const cleanId = id.trim();

    if (!Types.ObjectId.isValid(cleanId)) {
      return null;
    }

    const consultant = await this.consultantModel
      .findOne({
        userId: new Types.ObjectId(cleanId),
      })
      .exec();

    return consultant ? this.toEntity(consultant) : null;
  }

  async findAll(): Promise<ConsultantWithUserDetails[]> {
    return this.consultantModel
      .aggregate([
        {
          $match: {
            isAvailable: true, // Only include available consultants
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: "$_id",
            profession: 1,
            skills: 1,
            hourlyRate: 1,
            averageRating: 1,
            totalReviews: 1,
            isAvailable: 1,
            createdAt: 1,
            updatedAt: 1,
            "user.fullName": { $ifNull: ["$userDetails.fullName", "N/A"] },
            "user.email": { $ifNull: ["$userDetails.email", "N/A"] },
            "user.phone": { $ifNull: ["$userDetails.phoneNumber", "N/A"] },
            "user.location": { $ifNull: ["$userDetails.location", "N/A"] },
          },
        },
      ])
      .exec();
  }

  async getConsultantsByPreferences(
    location: LocationDto,
    profession: string
  ): Promise<ConsultantWithUserDetails[]> {
    return this.consultantModel
      .aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [location.coordinates[0], location.coordinates[1]], // Test coordinates
            },
            distanceField: "dist.calculated",
            maxDistance: 100 * 1000, // 100 km in meters
            spherical: true,
          },
        },
        {
          $match: {
            "location.coordinates": { $exists: true, $ne: [] }, // Ensure valid coordinates
            profession: profession, // Filter by profession
            isAvailable: true, // Only available consultants
          },
        },
        {
          $lookup: {
            from: "users", // Assuming users collection
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails", // Flatten user details array
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: "$_id",
            profession: 1,
            skills: 1,
            hourlyRate: 1,
            averageRating: 1,
            totalReviews: 1,
            isAvailable: 1,
            createdAt: 1,
            updatedAt: 1,
            "user.fullName": { $ifNull: ["$userDetails.fullName", "N/A"] },
            "user.email": { $ifNull: ["$userDetails.email", "N/A"] },
            "user.phone": { $ifNull: ["$userDetails.phoneNumber", "N/A"] },
            "user.location": { $ifNull: ["$userDetails.location", "N/A"] },
          },
        },
      ])
      .exec();
  }

  async save(consultant: Consultant): Promise<Consultant> {
    const consultantDoc = await this.consultantModel
      .findOneAndUpdate({ _id: consultant.id }, consultant.toObject(), {
        upsert: true,
        new: true,
      })
      .exec();

    return this.toEntity(consultantDoc);
  }

  private toEntity(doc: ConsultantDocument): Consultant {
    const data = (doc.toObject ? doc.toObject() : doc) as any;
    return new Consultant(data, doc._id);
  }
}
