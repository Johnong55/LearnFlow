import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConstraintPriority, DayOfWeek } from '@prisma/client';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { LOCAL_TIME_PATTERN } from '../constants/validation.constants';

export class RecurringTimeDto {
  @ApiProperty({ enum: DayOfWeek, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(DayOfWeek, { each: true })
  weekdays!: DayOfWeek[];

  @ApiProperty({ example: '09:00', pattern: LOCAL_TIME_PATTERN.source })
  @Matches(LOCAL_TIME_PATTERN)
  startTime!: string;

  @ApiProperty({ example: '17:30', pattern: LOCAL_TIME_PATTERN.source })
  @Matches(LOCAL_TIME_PATTERN)
  endTime!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFlexible?: boolean;

  @ApiPropertyOptional({ enum: ConstraintPriority, default: ConstraintPriority.HARD })
  @IsOptional()
  @IsEnum(ConstraintPriority)
  constraintPriority?: ConstraintPriority;

  @ApiPropertyOptional({ minimum: 1, maximum: 5, default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 180, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(180)
  bufferBeforeMinutes?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 180, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(180)
  bufferAfterMinutes?: number;
}
