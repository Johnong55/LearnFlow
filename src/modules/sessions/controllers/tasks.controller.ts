import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { TaskFeedbackDto } from '../dto/task-feedback.dto';
import { SessionsService } from '../services/sessions.service';

@ApiTags('Learning Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly sessions: SessionsService) {}

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually complete an owned learning task' })
  complete(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.sessions.completeTask(userId, id);
  }

  @Post(':id/feedback')
  @ApiOperation({ summary: 'Record owned-task learning feedback' })
  feedback(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TaskFeedbackDto,
  ) {
    return this.sessions.feedback(userId, id, dto);
  }
}
