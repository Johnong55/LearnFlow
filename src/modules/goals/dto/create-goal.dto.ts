import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoalPriority, SkillLevel } from '@/generated/prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateGoalDto {
  @ApiProperty({ example: 'Build a production Node.js REST API' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;
  @ApiProperty({ example: 'Learn backend development and deploy an API within four months.' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;
  @ApiProperty({ example: 'Node.js' }) @IsString() @MinLength(1) @MaxLength(150) skillName!: string;
  @ApiPropertyOptional({ example: 'Backend Development' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  skillCategory?: string;
  @ApiProperty({ enum: SkillLevel }) @IsEnum(SkillLevel) currentLevel!: SkillLevel;
  @ApiProperty({ enum: SkillLevel }) @IsEnum(SkillLevel) targetLevel!: SkillLevel;
  @ApiProperty({ type: String, format: 'date-time' }) @Type(() => Date) @IsDate() targetDate!: Date;
  @ApiPropertyOptional({ enum: GoalPriority, default: GoalPriority.MEDIUM })
  @IsOptional()
  @IsEnum(GoalPriority)
  priority?: GoalPriority;
  @ApiProperty({ minimum: 0.5, maximum: 80, example: 8 })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0.5)
  @Max(80)
  weeklyAvailableHours!: number;
  @ApiProperty({
    type: [String],
    example: ['Deploy an authenticated API', 'Reach 80% test coverage'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  successCriteria!: string[];
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() userConstraints?: Record<
    string,
    unknown
  >;
}
