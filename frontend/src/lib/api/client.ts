import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";

import { getAccessToken, setAccessToken } from "@/lib/api/auth-session";
import { normalizeApiError } from "@/lib/api/errors";
import type { ApiResponse, AuthTokens } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

type RetryableConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
  _networkRetry?: boolean;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12_000,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12_000,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

let refreshPromise: Promise<string> | null = null;

function emitSessionExpired(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("skillpilot:session-expired"));
  }
}

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<ApiResponse<AuthTokens>>("/auth/refresh", {})
      .then(({ data }) => {
        setAccessToken(data.data.accessToken);
        return data.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    const status = error.response?.status;
    const isAuthRoute = config?.url?.startsWith("/auth/") ?? false;

    if (status === 401 && config && !config._authRetry && !isAuthRoute) {
      config._authRetry = true;
      try {
        const token = await refreshAccessToken();
        config.headers = AxiosHeaders.from(config.headers);
        config.headers.set("Authorization", `Bearer ${token}`);
        return await apiClient.request(config);
      } catch (refreshError) {
        setAccessToken(null);
        emitSessionExpired();
        throw normalizeApiError(refreshError);
      }
    }

    const isSafeRequest = config?.method?.toLowerCase() === "get";
    const isNetworkFailure = !error.response;
    if (config && isSafeRequest && isNetworkFailure && !config._networkRetry) {
      config._networkRetry = true;
      await new Promise((resolve) => setTimeout(resolve, 350));
      return apiClient.request(config);
    }

    throw normalizeApiError(error);
  },
);

export async function unwrap<T>(
  request: Promise<{ data: ApiResponse<T> }>,
): Promise<T> {
  const response = await request;
  return response.data.data;
}
