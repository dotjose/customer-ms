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
            _id: new Types.ObjectId(id),
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
          $lookup: {
            from: "professiondocuments",
            localField: "profession",
            foreignField: "_id",
            as: "professionDetails",
          },
        },
        {
          $unwind: {
            path: "$professionDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        // --- UNWIND reviews ---
        {
          $unwind: {
            path: "$reviews",
            preserveNullAndEmptyArrays: true,
          },
        },
        // --- SORT reviews by createdAt descending ---
        {
          $sort: {
            "reviews.createdAt": -1,
          },
        },
        // --- GROUP back to array ---
        {
          $group: {
            _id: "$_id",
            doc: { $first: "$$ROOT" }, // keep other fields
            sortedReviews: { $push: "$reviews" },
          },
        },
        // --- LIMIT to 20 ---
        {
          $addFields: {
            "doc.reviews": { $slice: ["$sortedReviews", 20] },
          },
        },
        {
          $replaceRoot: {
            newRoot: "$doc",
          },
        },
        // --- FINAL PROJECT ---
        {
          $project: {
            id: "$_id",
            profession: {
              id: "$professionDetails._id",
              name: { $ifNull: ["$professionDetails.name", "Unknown"] },
              description: { $ifNull: ["$professionDetails.description", ""] },
              icon: { $ifNull: ["$professionDetails.icon", ""] },
            },
            skills: { $ifNull: ["$skills", []] },
            education: { $ifNull: ["$education", []] },
            experiences: { $ifNull: ["$experiences", []] },
            hourlyRate: 1,
            averageRating: 1,
            totalReviews: 1,
            isAvailable: 1,
            createdAt: 1,
            updatedAt: 1,
            user: {
              firstName: { $ifNull: ["$userDetails.firstName", "N/A"] },
              lastName: { $ifNull: ["$userDetails.lastName", "N/A"] },
              email: { $ifNull: ["$userDetails.email", "N/A"] },
              phone: { $ifNull: ["$userDetails.phoneNumber", "N/A"] },
              location: { $ifNull: ["$userDetails.location", "N/A"] },
              avatar: { $ifNull: ["$userDetails.avatar", ""] },
              bio: { $ifNull: ["$userDetails.bio", ""] },
              socialLinks: { $ifNull: ["$userDetails.socialLinks", []] },
            },
            reviews: 1,
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
      .populate({
        path: "profession",
        model: "ProfessionDocument",
      })
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
          $lookup: {
            from: "professiondocuments", // Lookup profession details from "professions" collection
            localField: "profession", // Reference from Consultant schema
            foreignField: "_id",
            as: "professionDetails",
          },
        },
        {
          $unwind: {
            path: "$professionDetails",
            preserveNullAndEmptyArrays: true, // Keep consultant even if profession is null
          },
        },
        {
          $project: {
            id: "$_id",
            profession: {
              id: "$professionDetails._id",
              name: { $ifNull: ["$professionDetails.name", "Unknown"] },
              description: { $ifNull: ["$professionDetails.description", ""] },
              icon: { $ifNull: ["$professionDetails.icon", ""] },
            },
            skills: 1,
            hourlyRate: 1,
            averageRating: 1,
            totalReviews: 1,
            isAvailable: 1,
            createdAt: 1,
            updatedAt: 1,
            "user.firstName": { $ifNull: ["$userDetails.firstName", "N/A"] },
            "user.lastName": { $ifNull: ["$userDetails.lastName", "N/A"] },
            "user.email": { $ifNull: ["$userDetails.email", "N/A"] },
            "user.phone": { $ifNull: ["$userDetails.phoneNumber", "N/A"] },
            "user.location": { $ifNull: ["$userDetails.location", "N/A"] },
            "user.avatar": { $ifNull: ["$userDetails.avatar", ""] },
          },
        },
      ])
      .exec();
  }

  async getConsultantsByPreferences(
    location: LocationDto | null,
    profession: string | null,
    page: number,
    limit: number,
    sortBy?: "rating" | "hourlyRate" | "distance"
  ): Promise<{ consultants: ConsultantWithUserDetails[]; totalItems: number }> {
    const skip = (page - 1) * limit;

    // Build the initial query object
    const query: any = { isAvailable: true }; // Start with isAvailable

    if (profession) {
      query.profession = new Types.ObjectId(profession); // Convert to ObjectId
    }

    const aggregationPipeline: any[] = [];

    // Initial match stage using the query object
    aggregationPipeline.push({ $match: query });

    aggregationPipeline.push({
      $lookup: {
        from: "professiondocuments", // Lookup profession details from "professions" collection
        localField: "profession", // Reference from Consultant schema
        foreignField: "_id",
        as: "professionDetails",
      },
    });

    aggregationPipeline.push({
      $unwind: {
        path: "$professionDetails",
        preserveNullAndEmptyArrays: true, // Keep consultant even if profession is null
      },
    });

    // Lookup user details (this includes location)
    aggregationPipeline.push({
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userDetails",
      },
    });
    aggregationPipeline.push({
      $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true },
    });

    // GeoJSON filtering (conditionally added)
    // Apply location filter if coordinates are provided
    if (location?.coordinates) {
      aggregationPipeline.push({
        $match: {
          "userDetails.location.coordinates": {
            $geoWithin: {
              $centerSphere: [location.coordinates, 0.02354], // ~1.5 mile radius
            },
          },
        },
      });
    }

    // Lookup location details from "locations" collection (if needed)
    aggregationPipeline.push({
      $lookup: {
        from: "locations",
        localField: "locationId",
        foreignField: "_id",
        as: "locationDetails",
      },
    });
    aggregationPipeline.push({
      $unwind: { path: "$locationDetails", preserveNullAndEmptyArrays: true },
    });

    // Project only necessary fields
    aggregationPipeline.push({
      $project: {
        id: "$_id",
        profession: {
          id: "$professionDetails._id",
          name: { $ifNull: ["$professionDetails.name", "Unknown"] },
          description: { $ifNull: ["$professionDetails.description", ""] },
          icon: { $ifNull: ["$professionDetails.icon", ""] },
        },
        skills: 1,
        hourlyRate: 1,
        averageRating: 1,
        totalReviews: 1,
        isAvailable: 1,
        updatedAt: 1,
        createdAt: 1,
        location: "$userDetails.location", // User location
        distance: 1, // Include the distance in the projection
        "user.firstName": { $ifNull: ["$userDetails.firstName", "N/A"] },
        "user.lastName": { $ifNull: ["$userDetails.lastName", "N/A"] },
        "user.email": { $ifNull: ["$userDetails.email", "N/A"] },
        "user.phone": { $ifNull: ["$userDetails.phoneNumber", "N/A"] },
        "user.location": { $ifNull: ["$userDetails.location", "N/A"] },
        "user.avatar": { $ifNull: ["$userDetails.avatar", ""] },
      },
    });

    // Dynamic sorting logic
    const sortStage: any = { $sort: { createdAt: -1 } }; // Default sorting

    if (sortBy === "rating") {
      sortStage.$sort.averageRating = -1;
    } else if (sortBy === "hourlyRate") {
      sortStage.$sort.hourlyRate = 1;
    } else if (sortBy === "distance" && location?.coordinates) {
      sortStage.$sort.distance = 1; // Sort by calculated distance
    }

    aggregationPipeline.push(sortStage);

    // Pagination
    aggregationPipeline.push({ $skip: skip });
    aggregationPipeline.push({ $limit: limit });

    // Count total items *after* filtering (using aggregation)
    const countAggregation = [...aggregationPipeline]; // Clone the pipeline
    countAggregation.pop(); // Remove the $skip and $limit stages
    countAggregation.push({ $count: "total" }); // Add a $count stage

    const countResult = await this.consultantModel
      .aggregate(countAggregation)
      .exec();
    const totalItems = countResult.length > 0 ? countResult[0].total : 0;

    const consultants = await this.consultantModel
      .aggregate(aggregationPipeline)
      .exec();

    return { consultants, totalItems };
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
