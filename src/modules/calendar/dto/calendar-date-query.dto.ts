import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class CalendarDateQueryDto {
  @ApiPropertyOptional({ example: '2026-07-30', description: 'Date in the user timezone' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}
