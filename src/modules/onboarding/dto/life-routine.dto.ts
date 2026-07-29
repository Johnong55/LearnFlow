import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoutineType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { RecurringTimeDto } from '@/common/dto/recurring-time.dto';

export class LifeActivityDto extends RecurringTimeDto {
  @ApiProperty({ enum: RoutineType })
  @IsEnum(RoutineType)
  type!: RoutineType;

  @ApiProperty({ example: 'Dinner with family' })
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

export class LifeRoutineDto {
  @ApiProperty({ type: [LifeActivityDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => LifeActivityDto)
  activities!: LifeActivityDto[];
}
