import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ConsultantDocument } from "../../persistence/mongodb/schemas/consultant.schema";
import { Consultant } from "domain/consultant/consultant.entity";
import { ConsultantRepository } from "domain/consultant/consultant.repository";
import { ConsultantWithUserDetails } from "presentation/dtos/consultant.dto";
import { LocationDto } from "presentation/dtos/auth.dto";
import { PaginatedResultDTO } from "presentation/dtos/common.dto";

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
            resumeUrl: { $ifNull: ["$resumeUrl", ""] },
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
            resumeUrl: { $ifNull: ["$resumeUrl", ""] },
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

  async findAll(
    page: number,
    limit: number
  ): Promise<{
    data: ConsultantWithUserDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const aggregationPipeline = [
      {
        $match: {
          isAvailable: true,
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
      {
        $facet: {
          metadata: [{ $count: "total" }, { $addFields: { page, limit } }],
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                id: "$_id",
                profession: {
                  id: "$professionDetails._id",
                  name: { $ifNull: ["$professionDetails.name", "Unknown"] },
                  description: {
                    $ifNull: ["$professionDetails.description", ""],
                  },
                  icon: { $ifNull: ["$professionDetails.icon", ""] },
                },
                skills: 1,
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
          ],
        },
      },
      {
        $unwind: "$metadata",
      },
      {
        $project: {
          data: 1,
          total: "$metadata.total",
          page: "$metadata.page",
          totalPages: {
            $ceil: { $divide: ["$metadata.total", "$metadata.limit"] },
          },
        },
      },
    ];

    const result = await this.consultantModel
      .aggregate(aggregationPipeline)
      .exec();

    return (
      result[0] || {
        data: [],
        total: 0,
        page,
        totalPages: 0,
      }
    );
  }

  async getConsultantsByPreferences(
    location: LocationDto | null,
    profession: string | null,
    page: number = 1,
    limit: number = 20,
    sortBy?: "rating" | "hourlyRate" | "distance"
  ): Promise<PaginatedResultDTO<ConsultantWithUserDetails>> {
    const skip = (page - 1) * limit;

    // 1. Build the base pipeline stages
    const pipeline = this.buildBasePipeline(profession, location);

    // 2. Add sorting
    this.addSortingStage(pipeline, sortBy, location);

    // 3. Get paginated results and total count in a single round trip
    const [result] = await this.consultantModel
      .aggregate([
        {
          $facet: {
            metadata: [...pipeline, { $count: "total" }],
            data: [...pipeline, { $skip: skip }, { $limit: limit }],
          },
        },
        {
          $project: {
            consultants: "$data",
            total: { $arrayElemAt: ["$metadata.total", 0] },
            page: { $literal: page },
            limit: { $literal: limit },
            totalPages: {
              $ceil: {
                $divide: [{ $arrayElemAt: ["$metadata.total", 0] }, limit],
              },
            },
          },
        },
      ])
      .exec();

    return {
      items: result?.consultants || [],
      total: result?.total || 0,
      page,
      limit,
      totalPages: result?.totalPages || 0,
    };
  }

  // Helper methods for pipeline construction
  private buildBasePipeline(
    profession: string | null,
    location: LocationDto | null
  ): any[] {
    const pipeline: any[] = [];
    const matchStage: any = { isAvailable: true };

    if (profession) {
      matchStage.profession = new Types.ObjectId(profession);
    }

    pipeline.push({ $match: matchStage });

    // Profession details lookup
    pipeline.push(
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
      }
    );

    // User details lookup
    pipeline.push(
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
      }
    );

    // Location filtering
    if (location?.coordinates) {
      pipeline.push({
        $match: {
          "userDetails.location.coordinates": {
            $geoWithin: {
              $centerSphere: [location.coordinates, 0.02354], // ~1.5 mile radius
            },
          },
        },
      });
    }

    // Projection
    pipeline.push({
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
        location: "$userDetails.location",
        distance: 1,
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
    });

    return pipeline;
  }

  private addSortingStage(
    pipeline: any[],
    sortBy?: string,
    location?: LocationDto | null
  ): void {
    const sortStage: any = { $sort: {} };

    // Default sorting
    sortStage.$sort.createdAt = -1;

    // Apply additional sorting criteria
    if (sortBy === "rating") {
      sortStage.$sort.averageRating = -1;
    } else if (sortBy === "hourlyRate") {
      sortStage.$sort.hourlyRate = 1;
    } else if (sortBy === "distance" && location?.coordinates) {
      sortStage.$sort.distance = 1;
    }

    pipeline.push(sortStage);
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
