import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '@/infrastructure/logging/audit.service';
import { AuthRepository } from '../repositories/auth.repository';
import { AuthService } from '../services/auth.service';
import { PasswordService } from '../services/password.service';

describe('AuthService', () => {
  let service: AuthService;
  const repository = { revokeRefreshToken: jest.fn() };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: repository },
        { provide: PasswordService, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: {} },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('revokes the supplied refresh token on logout', async () => {
    repository.revokeRefreshToken.mockResolvedValue({ count: 1 });
    await expect(service.logout('raw-refresh-token', 'user-id', {})).resolves.toEqual({
      message: 'Logged out successfully.',
    });
    expect(repository.revokeRefreshToken).toHaveBeenCalledWith(
      expect.stringMatching(/^[a-f0-9]{64}$/),
    );
  });

  it('allows cookie cleanup when no refresh token is supplied', async () => {
    await service.logout(undefined, 'user-id', {});
    expect(repository.revokeRefreshToken).not.toHaveBeenCalled();
  });
});
