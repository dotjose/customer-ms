import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { RolesGuard } from "infrastructure/guards/roles.guard";
import { Roles } from "infrastructure/decorators/roles.decorator";
import { JwtAuthGuard } from "infrastructure/guards/jwt-auth.guard";
import {
  CreateAdminDto,
  UpdateAdminDto,
  UserSearchDto,
} from "../dtos/admin.dto";
import {
  CreateAdminCommand,
  UpdateAdminCommand,
  DeleteAdminCommand,
  BlockUserCommand,
  SuspendUserCommand,
  BanUserCommand,
  ActivateUserCommand,
} from "application/commands/admin/admin.commands";
import {
  GetUsersQuery,
  GetUserByIdQuery,
  GetAdminsQuery,
  GetAdminByIdQuery,
  GetPlatformStatsQuery,
} from "application/queries/admin/admin.queries";

@ApiTags("Admin Management")
@ApiBearerAuth()
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminUserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  // Admins Management
  @Post("users")
  @ApiOperation({ summary: "Create a new admin user" })
  async createAdmin(@Body() dto: CreateAdminDto) {
    return this.commandBus.execute(
      new CreateAdminCommand(dto.email, dto.firstName, dto.lastName, dto.phoneNumber)
    );
  }

  @Patch("users/:id")
  @ApiOperation({ summary: "Update an admin user" })
  async updateAdmin(@Param("id") id: string, @Body() dto: UpdateAdminDto) {
    return this.commandBus.execute(
      new UpdateAdminCommand(id, dto.firstName, dto.lastName, dto.phoneNumber)
    );
  }

  @Delete("users/:id")
  @ApiOperation({ summary: "Delete an admin user" })
  async deleteAdmin(@Param("id") id: string) {
    return this.commandBus.execute(new DeleteAdminCommand(id));
  }

  @Get("users")
  @ApiOperation({ summary: "Get all admin users" })
  async getAdmins(@Query() query: any) {
    return this.queryBus.execute(
      new GetAdminsQuery(query.offset, query.limit, query.search)
    );
  }

  // Users Management
  @Get("customers/stats")
  @ApiOperation({ summary: "Get platform user stats" })
  async getPlatformStats() {
    return this.queryBus.execute(new GetPlatformStatsQuery());
  }

  @Get("customers")
  @ApiOperation({ summary: "Get all customers (paginated/filtered)" })
  async getCustomers(@Query() query: UserSearchDto) {
    return this.queryBus.execute(
      new GetUsersQuery(query.offset, query.limit, query.search, query.status, query.role)
    );
  }

  @Get("customers/:id")
  @ApiOperation({ summary: "Get customer by ID" })
  async getCustomer(@Param("id") id: string) {
    return this.queryBus.execute(new GetUserByIdQuery(id));
  }

  @Patch("customers/:id/block")
  @ApiOperation({ summary: "Block a customer" })
  async blockUser(@Param("id") id: string) {
    return this.commandBus.execute(new BlockUserCommand(id));
  }

  @Patch("customers/:id/suspend")
  @ApiOperation({ summary: "Suspend a customer" })
  async suspendUser(@Param("id") id: string) {
    return this.commandBus.execute(new SuspendUserCommand(id));
  }

  @Patch("customers/:id/ban")
  @ApiOperation({ summary: "Ban a customer" })
  async banUser(@Param("id") id: string) {
    return this.commandBus.execute(new BanUserCommand(id));
  }

  @Patch("customers/:id/activate")
  @ApiOperation({ summary: "Activate a customer" })
  async activateUser(@Param("id") id: string) {
    return this.commandBus.execute(new ActivateUserCommand(id));
  }
}
