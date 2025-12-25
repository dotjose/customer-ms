import { IsEmail, IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class UpdatePreferencesDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  products?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  jobs?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  professionals?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  events?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  realestate?: boolean;
}

export class NewsletterSubscriberResponseDto {
  email: string;
  status: string;
  preferences: {
    products: boolean;
    jobs: boolean;
    professionals: boolean;
    events: boolean;
    realestate: boolean;
    frequency: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
