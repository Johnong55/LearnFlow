import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoutineType } from '@/generated/prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { RecurringTimeDto } from '@/common/dto/recurring-time.dto';

export class CreateRoutineDto extends RecurringTimeDto {
  @ApiProperty({ enum: RoutineType }) @IsEnum(RoutineType) type!: RoutineType;
  @ApiProperty({ example: 'Morning exercise' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title!: string;
  @ApiPropertyOptional({ minimum: 5, maximum: 1440 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  minimumDurationMinutes?: number;
  @ApiPropertyOptional({ minimum: 5, maximum: 1440 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  preferredDurationMinutes?: number;
}
