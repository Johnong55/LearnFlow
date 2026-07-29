import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationStatus } from '@/generated/prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({ enum: NotificationStatus })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}
