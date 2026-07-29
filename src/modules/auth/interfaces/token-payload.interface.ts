import type { UserRole } from '@/generated/prisma/client';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: 'access';
}
export interface RefreshTokenPayload {
  sub: string;
  familyId: string;
  type: 'refresh';
}
