import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'learner@example.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;
}
