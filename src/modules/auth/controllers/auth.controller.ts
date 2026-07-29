import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import type { AuthenticatedUser } from '@/common/types/authenticated-request';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshDto } from '../dto/refresh.dto';
import { RegisterDto } from '../dto/register.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { AuthService } from '../services/auth.service';

type RequestWithId = Request & { requestId?: string };

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Create an account' })
  async register(
    @Body() dto: RegisterDto,
    @Req() request: RequestWithId,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.register(dto, this.context(request));
    this.setRefreshCookie(response, result.tokens.refreshToken);
    return result;
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Sign in' })
  async login(
    @Body() dto: LoginDto,
    @Req() request: RequestWithId,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(dto.email, dto.password, this.context(request));
    this.setRefreshCookie(response, result.tokens.refreshToken);
    return result;
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate a refresh token' })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() request: RequestWithId,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = dto.refreshToken ?? (request.cookies?.refresh_token as string | undefined);
    if (!token) throw new UnauthorizedException('A refresh token is required.');
    const result = await this.auth.refresh(token, this.context(request));
    this.setRefreshCookie(response, result.refreshToken);
    return result;
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: 'Revoke a refresh token' })
  async logout(
    @Body() dto: RefreshDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithId,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.logout(
      dto.refreshToken ?? (request.cookies?.refresh_token as string | undefined),
      user.id,
      this.context(request),
    );
    response.clearCookie('refresh_token', this.cookieOptions());
    return result;
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset instructions' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset a password with a one-time token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get the current authenticated identity' })
  me(@CurrentUser('id') userId: string) {
    return this.auth.me(userId);
  }

  private context(request: RequestWithId) {
    return {
      requestId: request.requestId,
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    };
  }

  private setRefreshCookie(response: Response, token: string): void {
    response.cookie('refresh_token', token, {
      ...this.cookieOptions(),
      maxAge: this.config.get<number>('auth.refreshExpiresDays', 30) * 86_400_000,
    });
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get<boolean>('auth.cookieSecure', false),
      sameSite: 'strict' as const,
      path: '/api/v1/auth',
      domain: this.config.get<string>('auth.cookieDomain') || undefined,
    };
  }
}
