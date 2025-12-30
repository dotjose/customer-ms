import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { SearchUserFeedbackQuery } from "../admin.queries";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ConsultantDocument } from "infrastructure/persistence/mongodb/schemas/consultant.schema";

@QueryHandler(SearchUserFeedbackQuery)
export class SearchUserFeedbackHandler implements IQueryHandler<SearchUserFeedbackQuery> {
  constructor(
    @InjectModel(ConsultantDocument.name)
    private readonly consultantModel: Model<ConsultantDocument>
  ) {}

  async execute(query: SearchUserFeedbackQuery) {
    const { offset = 0, limit = 10, search = "", userId } = query;
    
    const pipeline: any[] = [
      { $unwind: "$reviews" },
      {
        $project: {
          _id: 0,
          consultantId: "$_id",
          userId: "$reviews.userId",
          userName: "$reviews.userName",
          rating: "$reviews.rating",
          review: "$reviews.review",
          createdAt: "$reviews.createdAt",
        }
      }
    ];

    if (userId) {
      pipeline.push({ $match: { userId: new Types.ObjectId(userId) } });
    }

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { userName: { $regex: search, $options: "i" } },
            { review: { $regex: search, $options: "i" } },
          ]
        }
      });
    }

    const [items, countResult] = await Promise.all([
      this.consultantModel.aggregate([
        ...pipeline,
        { $sort: { createdAt: -1 } },
        { $skip: offset },
        { $limit: limit }
      ]),
      this.consultantModel.aggregate([
        ...pipeline,
        { $count: "total" }
      ])
    ]);

    return {
      items,
      total: countResult[0]?.total || 0
    };
  }
}
