import { ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek, LearningFormat, LearningStyle } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ArrayUnique,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) @MaxLength(150) fullName?: string;
  @ApiPropertyOptional({ example: 'Asia/Ho_Chi_Minh' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;
  @ApiPropertyOptional({ example: 'vi-VN' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  locale?: string;
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfBirth?: Date;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) occupation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) jobTitle?: string;
  @ApiPropertyOptional({ enum: LearningStyle })
  @IsOptional()
  @IsEnum(LearningStyle)
  preferredLearningStyle?: LearningStyle;
  @ApiPropertyOptional({ minimum: 15, maximum: 240 })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(240)
  preferredSessionMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) preferredStudyTime?: string;
  @ApiPropertyOptional({ enum: DayOfWeek, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(DayOfWeek, { each: true })
  preferredStudyDays?: DayOfWeek[];
  @ApiPropertyOptional({ enum: LearningFormat })
  @IsOptional()
  @IsEnum(LearningFormat)
  preferredLearningFormat?: LearningFormat;
  @ApiPropertyOptional({ minimum: 15, maximum: 480 })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  maxDailyLearningMinutes?: number;
  @ApiPropertyOptional({ minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxCognitiveLoad?: number;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() notifications?: Record<
    string,
    boolean
  >;
}
