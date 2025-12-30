import {
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { RolesGuard } from "../../infrastructure/guards/roles.guard";
import { Roles } from "../../infrastructure/decorators/roles.decorator";
import { JwtAuthGuard } from "../../infrastructure/guards/jwt-auth.guard";
import { FeedbackSearchDto } from "../dtos/admin.dto";
import { SearchUserFeedbackQuery } from "application/queries/admin/admin.queries";

@ApiTags("Admin Feedback")
@ApiBearerAuth()
@Controller("admin/feedbacks")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminFeedbackController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: "Search and review user feedback" })
  async getFeedbacks(@Query() query: FeedbackSearchDto) {
    return this.queryBus.execute(
      new SearchUserFeedbackQuery(query.offset, query.limit, query.search, query.userId)
    );
  }
}
