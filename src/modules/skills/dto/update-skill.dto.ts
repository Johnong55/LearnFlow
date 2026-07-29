import { ApiPropertyOptional } from '@nestjs/swagger';
import { SkillLevel, UserSkillType } from '@/generated/prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateSkillDto {
  @ApiPropertyOptional({ enum: UserSkillType })
  @IsOptional()
  @IsEnum(UserSkillType)
  type?: UserSkillType;
  @ApiPropertyOptional({ enum: SkillLevel })
  @IsOptional()
  @IsEnum(SkillLevel)
  currentLevel?: SkillLevel;
  @ApiPropertyOptional({ enum: SkillLevel })
  @IsOptional()
  @IsEnum(SkillLevel)
  targetLevel?: SkillLevel;
  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  confidenceLevel?: number;
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastPracticedAt?: Date;
}
