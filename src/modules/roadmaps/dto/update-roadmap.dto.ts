import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateRoadmapDto {
  @ApiPropertyOptional({ example: 'My Backend Engineering Roadmap' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(250)
  title?: string;
}
