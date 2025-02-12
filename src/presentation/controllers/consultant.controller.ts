import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  BadRequestException,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

import {
  SearchConsultantsDto,
  CreateConsultantProfileDto,
  ConsultantWithUserDetails,
} from "../dtos/consultant.dto";
import { GetNearbyConsultantsQuery } from "application/queries/consultant/get-nearby-consultants.query";
import { UpdateConsultantProfileCommand } from "application/commands/consultant/update-profile.command";
import { SearchConsultantsQuery } from "application/queries/consultant/search-consultants.query";
import { GetConsultantDetailQuery } from "application/queries/consultant/get-consultant-detail.query";
import { GetProfessionsQuery } from "application/queries/consultant/get-professions.query";

@ApiTags("Consultants")
@Controller("consultants")
export class ConsultantController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get()
  @ApiOperation({ summary: "Get nearby consultants" })
  @ApiResponse({
    status: 200,
    description: "Returns paginated consultant list",
  })
  async getNearbyConsultants(
    @Query() searchParams: SearchConsultantsDto
  ): Promise<ConsultantWithUserDetails[]> {
    const query = new GetNearbyConsultantsQuery(searchParams);
    return this.queryBus.execute(query);
  }

  @Get("/search")
  @ApiOperation({ summary: "Search and filter consultants" })
  @ApiResponse({
    status: 200,
    description: "Returns paginated sorted consultant list",
  })
  async searchConsultants(
    @Query() searchParams: SearchConsultantsDto
  ): Promise<ConsultantWithUserDetails[]> {
    if (
      searchParams.location?.coordinates &&
      searchParams.location?.coordinates?.length !== 2
    ) {
      throw new BadRequestException(
        "Coordinates must be [longitude, latitude]"
      );
    }

    const query = new SearchConsultantsQuery(searchParams);
    return this.queryBus.execute(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get consultant detail profile" })
  @ApiResponse({
    status: 200,
    description: "Returns consultant detail with reviews",
  })
  async getConsultant(
    @Param("id") id: string
  ): Promise<ConsultantWithUserDetails> {
    const query = new GetConsultantDetailQuery(id);
    return this.queryBus.execute(query);
  }

  @Post()
  @ApiOperation({ summary: "Create consultant profile" })
  @ApiResponse({ status: 201, description: "Consultant profile created" })
  async createProfile(@Body() dto: CreateConsultantProfileDto) {
    const command = new UpdateConsultantProfileCommand(dto);
    return this.commandBus.execute(command);
  }

  @Get("/professions/list")
  @ApiOperation({ summary: "Get professions list" })
  @ApiResponse({ status: 200, description: "Returns list of professions" })
  async getProfessions() {
    const professions = await this.queryBus.execute(new GetProfessionsQuery());
    return professions;
  }
}
