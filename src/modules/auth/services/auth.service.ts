import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import type { UserRole } from '@/generated/prisma/client';
import { AuditService } from '@/infrastructure/logging/audit.service';
import { AuthRepository } from '../repositories/auth.repository';
import { PasswordService } from './password.service';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../interfaces/token-payload.interface';
import type { RegisterDto } from '../dto/register.dto';

interface ClientContext {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}
export interface SafeUser {
  id: string;
  email: string;
  role: UserRole;
  profile: unknown;
  preference: unknown;
  onboardingCompletedAt: Date | null;
}
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async register(
    dto: RegisterDto,
    context: ClientContext,
  ): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.repository.findUserByEmail(email);
    if (existing) throw new ConflictException('An account with this email already exists.');
    const user = await this.repository.createUser(
      email,
      await this.passwords.hash(dto.password),
      dto.fullName.trim(),
    );
    const tokens = await this.issueTokenPair(user, randomUUID(), context);
    void this.audit.record({
      userId: user.id,
      action: 'AUTH_REGISTER',
      entityType: 'User',
      entityId: user.id,
      requestId: context.requestId,
      ipAddress: context.ipAddress,
    });
    return { user: this.safeUser(user), tokens };
  }

  async login(
    emailInput: string,
    password: string,
    context: ClientContext,
  ): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const user = await this.repository.findUserByEmail(emailInput.trim().toLowerCase());
    if (!user || user.deletedAt || !(await this.passwords.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    await this.repository.updateLastLogin(user.id);
    const tokens = await this.issueTokenPair(user, randomUUID(), context);
    void this.audit.record({
      userId: user.id,
      action: 'AUTH_LOGIN',
      requestId: context.requestId,
      ipAddress: context.ipAddress,
    });
    return { user: this.safeUser(user), tokens };
  }

  async refresh(rawToken: string, context: ClientContext): Promise<TokenPair> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshTokenPayload>(rawToken, {
        secret: this.config.getOrThrow<string>('auth.refreshSecret'),
      });
      if (payload.type !== 'refresh') throw new Error('Wrong token type');
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const stored = await this.repository.findRefreshToken(this.hashToken(rawToken));
    if (
      !stored ||
      stored.userId !== payload.sub ||
      stored.familyId !== payload.familyId ||
      stored.user.deletedAt
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
    if (stored.revokedAt) {
      await this.repository.revokeTokenFamily(stored.familyId);
      throw new UnauthorizedException(
        'Refresh token reuse detected; the token family was revoked.',
      );
    }
    if (stored.expiresAt <= new Date())
      throw new UnauthorizedException('Invalid or expired refresh token.');

    const accessToken = await this.signAccessToken(stored.user);
    const refreshToken = await this.signRefreshToken(stored.userId, stored.familyId);
    await this.repository.rotateRefreshToken(
      stored.id,
      this.refreshRecord(stored.userId, stored.familyId, refreshToken, context),
    );
    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.get<string>('auth.accessExpiresIn', '15m'),
    };
  }

  async logout(
    rawToken: string | undefined,
    userId: string,
    context: ClientContext,
  ): Promise<{ message: string }> {
    if (rawToken) await this.repository.revokeRefreshToken(this.hashToken(rawToken));
    void this.audit.record({
      userId,
      action: 'AUTH_LOGOUT',
      requestId: context.requestId,
      ipAddress: context.ipAddress,
    });
    return { message: 'Logged out successfully.' };
  }

  async forgotPassword(emailInput: string): Promise<{ message: string }> {
    const user = await this.repository.findUserByEmail(emailInput.trim().toLowerCase());
    if (user && !user.deletedAt) {
      const rawToken = randomBytes(32).toString('base64url');
      const minutes = this.config.get<number>('auth.passwordResetExpiresMinutes', 30);
      await this.repository.createPasswordResetToken(
        user.id,
        this.hashToken(rawToken),
        new Date(Date.now() + minutes * 60_000),
      );
      // Delivery is deliberately decoupled: a notification worker can consume the audit metadata without storing the raw token.
      void this.audit.record({
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        metadata: { deliveryPending: true },
      });
    }
    return { message: 'If an eligible account exists, password reset instructions will be sent.' };
  }

  async resetPassword(rawToken: string, password: string): Promise<{ message: string }> {
    const stored = await this.repository.findPasswordResetToken(this.hashToken(rawToken));
    if (!stored || stored.usedAt || stored.expiresAt <= new Date() || stored.user.deletedAt) {
      throw new UnauthorizedException('Invalid or expired password reset token.');
    }
    try {
      await this.repository.consumePasswordResetToken(
        stored.id,
        stored.userId,
        await this.passwords.hash(password),
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired password reset token.');
    }
    void this.audit.record({ userId: stored.userId, action: 'PASSWORD_RESET_COMPLETED' });
    return { message: 'Password reset successfully. Please sign in again.' };
  }

  async me(userId: string): Promise<SafeUser> {
    const user = await this.repository.findActiveUserById(userId);
    if (!user) throw new UnauthorizedException('User account is unavailable.');
    return this.safeUser(user);
  }

  private async issueTokenPair(
    user: { id: string; email: string; role: UserRole },
    familyId: string,
    context: ClientContext,
  ): Promise<TokenPair> {
    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.signRefreshToken(user.id, familyId);
    await this.repository.createRefreshToken(
      this.refreshRecord(user.id, familyId, refreshToken, context),
    );
    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.get<string>('auth.accessExpiresIn', '15m'),
    };
  }

  private signAccessToken(user: { id: string; email: string; role: UserRole }): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('auth.accessSecret'),
      expiresIn: this.config.getOrThrow<string>('auth.accessExpiresIn') as SignOptions['expiresIn'],
    });
  }

  private signRefreshToken(userId: string, familyId: string): Promise<string> {
    const payload: RefreshTokenPayload = { sub: userId, familyId, type: 'refresh' };
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('auth.refreshSecret'),
      expiresIn: this.config.getOrThrow<string>(
        'auth.refreshExpiresIn',
      ) as SignOptions['expiresIn'],
    });
  }

  private refreshRecord(userId: string, familyId: string, token: string, context: ClientContext) {
    return {
      userId,
      familyId,
      tokenHash: this.hashToken(token),
      expiresAt: new Date(
        Date.now() + this.config.get<number>('auth.refreshExpiresDays', 30) * 86_400_000,
      ),
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private safeUser(user: {
    id: string;
    email: string;
    role: UserRole;
    profile: unknown;
    preference: unknown;
    onboardingCompletedAt: Date | null;
  }): SafeUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      preference: user.preference,
      onboardingCompletedAt: user.onboardingCompletedAt,
    };
  }
}
