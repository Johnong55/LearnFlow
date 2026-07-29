import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek, LearningFormat, SkillLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CurrentSkillDto {
  @ApiProperty({ example: 'JavaScript' })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @ApiProperty({ enum: SkillLevel })
  @IsEnum(SkillLevel)
  level!: SkillLevel;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  confidenceLevel?: number;
}

export class DesiredSkillDto {
  @ApiProperty({ example: 'Node.js' })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @ApiProperty({ enum: SkillLevel, default: SkillLevel.NONE })
  @IsEnum(SkillLevel)
  currentLevel!: SkillLevel;

  @ApiProperty({ enum: SkillLevel, example: SkillLevel.ADVANCED })
  @IsEnum(SkillLevel)
  targetLevel!: SkillLevel;
}

export class LearningPreferencesDto {
  @ApiProperty({ type: [DesiredSkillDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => DesiredSkillDto)
  desiredSkills!: DesiredSkillDto[];

  @ApiPropertyOptional({ type: [CurrentSkillDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CurrentSkillDto)
  currentSkills?: CurrentSkillDto[];

  @ApiProperty({ example: 'Build and deploy a production REST API.' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  learningGoal!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  expectedDeadline!: Date;

  @ApiProperty({ minimum: 0.5, maximum: 80, example: 8 })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0.5)
  @Max(80)
  hoursAvailablePerWeek!: number;

  @ApiProperty({ enum: DayOfWeek, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(DayOfWeek, { each: true })
  preferredStudyDays!: DayOfWeek[];

  @ApiProperty({ minimum: 15, maximum: 240, example: 45 })
  @IsInt()
  @Min(15)
  @Max(240)
  preferredSessionMinutes!: number;

  @ApiProperty({ enum: LearningFormat })
  @IsEnum(LearningFormat)
  preferredLearningFormat!: LearningFormat;

  @ApiProperty({ minimum: 1, maximum: 10, example: 7 })
  @IsInt()
  @Min(1)
  @Max(10)
  maximumCognitiveWorkload!: number;
}
