import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek, WorkMode } from '@/generated/prisma/client';
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
import { LOCAL_TIME_PATTERN } from '@/common/constants/validation.constants';

export class WorkScheduleDto {
  @ApiProperty({ enum: DayOfWeek, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(DayOfWeek, { each: true })
  workingDays!: DayOfWeek[];

  @ApiProperty({ example: '08:30' })
  @Matches(LOCAL_TIME_PATTERN)
  startTime!: string;

  @ApiProperty({ example: '17:30' })
  @Matches(LOCAL_TIME_PATTERN)
  endTime!: string;

  @ApiProperty({ enum: WorkMode })
  @IsEnum(WorkMode)
  workMode!: WorkMode;

  @ApiPropertyOptional({ minimum: 0, maximum: 240, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(240)
  commuteMinutes?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  flexibleHours?: boolean;
}
