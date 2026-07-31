import type { AxiosRequestConfig } from "axios";

import { apiClient, unwrap } from "@/lib/api/client";
import { setAccessToken } from "@/lib/api/auth-session";
import type {
  ApiResponse,
  AuthResult,
  AuthTokens,
  CurrentUser,
} from "@/types/api";

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = SignInInput & {
  fullName: string;
};

function requestConfig(signal?: AbortSignal): AxiosRequestConfig {
  return signal ? { signal } : {};
}

export const authApi = {
  async signIn(input: SignInInput, signal?: AbortSignal): Promise<AuthResult> {
    const result = await unwrap(
      apiClient.post<ApiResponse<AuthResult>>(
        "/auth/login",
        input,
        requestConfig(signal),
      ),
    );
    setAccessToken(result.tokens.accessToken);
    return result;
  },

  async signUp(input: SignUpInput, signal?: AbortSignal): Promise<AuthResult> {
    const result = await unwrap(
      apiClient.post<ApiResponse<AuthResult>>(
        "/auth/register",
        input,
        requestConfig(signal),
      ),
    );
    setAccessToken(result.tokens.accessToken);
    return result;
  },

  forgotPassword(
    email: string,
    signal?: AbortSignal,
  ): Promise<{ message: string }> {
    return unwrap(
      apiClient.post<ApiResponse<{ message: string }>>(
        "/auth/forgot-password",
        { email },
        requestConfig(signal),
      ),
    );
  },

  resetPassword(
    token: string,
    password: string,
    signal?: AbortSignal,
  ): Promise<{ message: string }> {
    return unwrap(
      apiClient.post<ApiResponse<{ message: string }>>(
        "/auth/reset-password",
        { token, password },
        requestConfig(signal),
      ),
    );
  },

  me(signal?: AbortSignal): Promise<CurrentUser> {
    return unwrap(
      apiClient.get<ApiResponse<CurrentUser>>(
        "/auth/me",
        requestConfig(signal),
      ),
    );
  },

  async refresh(signal?: AbortSignal): Promise<AuthTokens> {
    const tokens = await unwrap(
      apiClient.post<ApiResponse<AuthTokens>>(
        "/auth/refresh",
        {},
        requestConfig(signal),
      ),
    );
    setAccessToken(tokens.accessToken);
    return tokens;
  },

  async logout(signal?: AbortSignal): Promise<void> {
    await apiClient.post("/auth/logout", {}, requestConfig(signal));
    setAccessToken(null);
  },
};
