import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  ValidateNested,
  IsDate,
  IsBoolean,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  IsUrl,
  IsMongoId,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { BadRequestException } from "@nestjs/common";

import { LocationDto } from "./auth.dto";
import { Consultant } from "domain/consultant/consultant.entity";

@ValidatorConstraint({ async: false })
export class IsStartDateBeforeEndDate implements ValidatorConstraintInterface {
  validate(startDate: Date, args: ValidationArguments) {
    const [object, property] = args.constraints;
    const endDate = object[property];
    // Allow if endDate is undefined (optional)
    if (!endDate) {
      return true;
    }
    return startDate <= endDate;
  }

  defaultMessage(args: ValidationArguments) {
    return `Start date must be before end date`;
  }
}

export class EducationDto {
  @ApiProperty()
  @IsString()
  institution: string;

  @ApiProperty()
  @IsString()
  degree: string;

  @ApiProperty()
  @IsString()
  field: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @Validate(IsStartDateBeforeEndDate, [{ property: "startDate" }])
  endDate?: Date;
}

export class ExperienceDto {
  @ApiProperty()
  @IsString()
  company: string;

  @ApiProperty()
  @IsString()
  position: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @Validate(IsStartDateBeforeEndDate, [{ property: "startDate" }]) // Pass startDate for validation
  endDate?: Date;
}

export class CreateConsultantProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  profession: string;

  @ApiProperty()
  @IsString()
  business: string;

  @ApiProperty()
  @IsString()
  about: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @ApiProperty()
  @IsBoolean()
  isAvailable: boolean;
}

export class SearchConsultantsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  profession?: string;

  @ApiProperty({
    required: false,
    type: String,
    example:
      '{"type":"Point","coordinates":[12.34,56.78],"address":"123 Main St"}',
    description: "Send location as a JSON string",
  })
  @IsOptional()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch {
      throw new BadRequestException(
        "Invalid location format. Expected JSON string."
      );
    }
  })
  location?: LocationDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  minRating?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxHourlyRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  page?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  limit?: string;

  @ApiProperty({ required: false, enum: ["rating", "hourlyRate", "distance"] })
  @IsOptional()
  @IsString()
  sortBy?: "rating" | "hourlyRate" | "distance";

  @ApiProperty({ required: false, enum: ["asc", "desc"] })
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc";
}

export interface ConsultantWithUserDetails {
  consultant: Consultant;
  user: {
    fullName: string;
    email: string;
    phone: string;
    location: LocationDto;
    avatar: string;
  };
}
