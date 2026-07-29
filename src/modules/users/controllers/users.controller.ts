import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UsersService } from '../services/users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get('me') @ApiOperation({ summary: 'Get the current user profile' }) getMe(
    @CurrentUser('id') id: string,
  ) {
    return this.users.getMe(id);
  }
  @Patch('me') @ApiOperation({ summary: 'Update the current user profile' }) updateMe(
    @CurrentUser('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.updateMe(id, dto);
  }
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete the current account' })
  deleteMe(@CurrentUser('id') id: string) {
    return this.users.deleteMe(id);
  }
}
