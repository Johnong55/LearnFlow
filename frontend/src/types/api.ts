export type ApiMeta = {
  requestId: string;
  timestamp: string;
};

export type ApiResponse<T> = {
  success: true;
  data: T;
  meta: ApiMeta;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
  meta: ApiMeta;
};

export type ApiError = {
  code: string;
  message: string;
  details: unknown[];
  requestId?: string;
  status?: number;
};

export type UserProfile = {
  fullName: string;
  timezone: string;
  locale: string;
  occupation: string | null;
  jobTitle: string | null;
};

export type UserPreference = {
  preferredLearningStyle: string | null;
  preferredSessionMinutes: number;
  preferredStudyTime: string | null;
  preferredStudyDays: string[];
  preferredLearningFormat: string | null;
  maxDailyLearningMinutes: number;
  maxCognitiveLoad: number;
  notifications: Record<string, boolean>;
};

export type CurrentUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  profile: UserProfile | null;
  preference: UserPreference | null;
  onboardingCompletedAt: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type AuthResult = {
  user: CurrentUser;
  tokens: AuthTokens;
};
