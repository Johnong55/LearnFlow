import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SkillLevel, UserSkillType } from '@/generated/prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({ example: 'Node.js' })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: 'Backend Development' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ enum: UserSkillType, default: UserSkillType.CURRENT })
  @IsOptional()
  @IsEnum(UserSkillType)
  type?: UserSkillType;

  @ApiPropertyOptional({ enum: SkillLevel, default: SkillLevel.NONE })
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
