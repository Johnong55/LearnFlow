import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityType, ConstraintPriority, DayOfWeek } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDate,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LOCAL_TIME_PATTERN } from '@/common/constants/validation.constants';

export class CreateAvailabilityRuleDto {
  @ApiProperty({ example: 'No study on Friday evening' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title!: string;
  @ApiProperty({ enum: AvailabilityType }) @IsEnum(AvailabilityType) type!: AvailabilityType;
  @ApiPropertyOptional({ enum: ConstraintPriority, default: ConstraintPriority.HARD })
  @IsOptional()
  @IsEnum(ConstraintPriority)
  constraintPriority?: ConstraintPriority;
  @ApiProperty({ enum: DayOfWeek, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(DayOfWeek, { each: true })
  weekdays!: DayOfWeek[];
  @ApiProperty({ example: '18:00' }) @Matches(LOCAL_TIME_PATTERN) startTime!: string;
  @ApiProperty({ example: '22:00' }) @Matches(LOCAL_TIME_PATTERN) endTime!: string;
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveFrom?: Date;
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveUntil?: Date;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() metadata?: Record<
    string,
    unknown
  >;
}
