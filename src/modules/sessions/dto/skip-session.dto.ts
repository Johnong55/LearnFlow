import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReschedulingMode } from '@/generated/prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class SkipSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ enum: ReschedulingMode, default: ReschedulingMode.BALANCED })
  @IsOptional()
  @IsEnum(ReschedulingMode)
  reschedulingMode?: ReschedulingMode;
}
