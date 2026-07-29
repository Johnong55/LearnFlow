import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { LOCAL_TIME_PATTERN } from '@/common/constants/validation.constants';

export class PersonalProfileDto {
  @ApiProperty({ example: 'Software developer' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  occupation!: string;

  @ApiPropertyOptional({ example: 'Backend Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  jobTitle?: string;

  @ApiProperty({ example: 'Asia/Ho_Chi_Minh' })
  @IsString()
  @MaxLength(100)
  timezone!: string;

  @ApiPropertyOptional({ example: 'vi-VN' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  locale?: string;

  @ApiProperty({ example: '06:30' })
  @Matches(LOCAL_TIME_PATTERN)
  wakeUpTime!: string;

  @ApiProperty({ example: '23:00' })
  @Matches(LOCAL_TIME_PATTERN)
  sleepTime!: string;
}
