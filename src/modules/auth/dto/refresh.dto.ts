import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshDto {
  @ApiPropertyOptional({
    description: 'May instead be supplied by the HttpOnly refresh_token cookie.',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
