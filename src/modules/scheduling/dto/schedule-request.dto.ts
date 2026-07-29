import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReschedulingMode } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Matches, Max, Min } from 'class-validator';

export class ScheduleRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  roadmapId!: string;

  @ApiPropertyOptional({ example: '2026-07-30', description: 'Local date in user timezone' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @ApiPropertyOptional({ example: '2026-08-27', description: 'Inclusive local date' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;

  @ApiPropertyOptional({ enum: ReschedulingMode, default: ReschedulingMode.BALANCED })
  @IsOptional()
  @IsEnum(ReschedulingMode)
  mode?: ReschedulingMode;

  @ApiPropertyOptional({ default: 25, minimum: 15, maximum: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(120)
  minimumSessionMinutes?: number;

  @ApiPropertyOptional({ default: 10, minimum: 0, maximum: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  breakMinutes?: number;
}
