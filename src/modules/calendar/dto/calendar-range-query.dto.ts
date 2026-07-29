import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class CalendarRangeQueryDto {
  @ApiPropertyOptional({ example: '2026-07-29T00:00:00.000Z' })
  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @ApiPropertyOptional({ example: '2026-08-05T00:00:00.000Z' })
  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;
}
