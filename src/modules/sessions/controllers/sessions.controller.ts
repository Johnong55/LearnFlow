import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CompleteSessionDto } from '../dto/complete-session.dto';
import { SkipSessionDto } from '../dto/skip-session.dto';
import { SessionsService } from '../services/sessions.service';

@ApiTags('Study Sessions')
@ApiBearerAuth()
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start or resume an owned study session' })
  start(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.sessions.start(userId, id);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause an in-progress study session' })
  pause(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.sessions.pause(userId, id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a session and optionally record feedback' })
  complete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteSessionDto,
  ) {
    return this.sessions.complete(userId, id, dto);
  }

  @Post(':id/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Skip a session and queue deterministic rebalancing' })
  skip(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SkipSessionDto,
  ) {
    return this.sessions.skip(userId, id, dto);
  }
}
