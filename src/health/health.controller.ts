import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { HealthService } from './health.service';

@Public()
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Combined service health' })
  async healthCheck() {
    return this.ready();
  }

  @Get('live')
  @ApiOperation({ summary: 'Process liveness probe' })
  live() {
    return this.health.live();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Dependency readiness probe' })
  async ready() {
    const result = await this.health.ready();
    if (result.status !== 'ok')
      throw new ServiceUnavailableException({
        code: 'SERVICE_NOT_READY',
        message: 'One or more required dependencies are unavailable.',
        details: result.details,
      });
    return result;
  }
}
