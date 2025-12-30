import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsString, IsOptional, IsEnum, Min, Max } from "class-validator";
import { UserRole, UserStatus } from "domain/user/user.entity";

export class CreateAdminDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsString()
  phoneNumber: string;
}

export class UpdateAdminDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsString()
  phoneNumber: string;
}

export class UserSearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  offset?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number;
}

export class FeedbackSearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  offset?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number;
}
