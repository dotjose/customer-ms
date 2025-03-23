import {
  IsEmail,
  IsString,
  IsOptional,
  ValidateNested,
  IsNumber,
  IsEnum,
  MinLength,
  Matches,
  IsPhoneNumber,
  Validate,
  IsUrl,
  IsArray,
  ArrayMaxSize,
  ArrayMinSize,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class IsEmailOrPhone {
  validate(value: any) {
    return IsEmail(value) || IsPhoneNumber(value, null); // Validates email or phone
  }

  defaultMessage() {
    return "The contact must be a valid email address or phone number";
  }
}

export class SocialLinkDto {
  @ApiProperty()
  @IsString()
  platform:
    | "facebook"
    | "twitter"
    | "instagram"
    | "linkedin"
    | "youtube"
    | "tiktok";

  @IsUrl()
  @ApiProperty()
  url: string;
}

export class LocationDto {
  @ApiPropertyOptional({ example: "Point" })
  @IsOptional()
  @IsString()
  @IsEnum(["Point"]) // Enforce GeoJSON type
  type?: "Point";

  @ApiProperty()
  @ApiPropertyOptional({ example: [12.34, 56.78] })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates?: [number, number]; // [longitude, latitude]

  @ApiProperty()
  @ApiPropertyOptional({ example: "123 Main St" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  radius?: number = 150;
}

export class RegisterUserDto {
  @ApiProperty({ example: "John" })
  @IsString()
  firstName: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  lastName: string;

  @ApiProperty({ example: "john@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "StrongPass123!" })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: "Password is too weak",
  })
  password: string;

  @ApiProperty({ example: "+1234567890", required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class LoginDto {
  @ApiProperty({ example: "john@example.com or +1234567890" })
  @IsString()
  @Validate(IsEmailOrPhone)
  contact: string;

  @ApiProperty({ example: "StrongPass123!" })
  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: "john@example.com or " })
  @IsEmail()
  @IsString()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ example: "NewStrongPass123!" })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: "Password is too weak",
  })
  newPassword: string;
}

export class ResendCodeDto {
  @ApiProperty()
  @IsString()
  userId: string;
}

enum NotificiationChannel {
  sms = "sms",
  email = "email",
}

export class VerifyCodeDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty({ default: NotificiationChannel.sms })
  @IsOptional()
  @IsEnum(NotificiationChannel)
  type?: NotificiationChannel;
}

export class UpdatePasswordDto {
  @ApiProperty({ example: "StrongPass123!" })
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: "Password is too weak",
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: "StrongPass123!" })
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: "Password is too weak",
  })
  @IsString()
  newPassword: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ type: SocialLinkDto })
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];

  @ApiPropertyOptional({ type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  userId?: string;
}

export class UserResponseDto {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  bio: string;
  social: SocialLinkDto[];
  location: LocationDto;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
