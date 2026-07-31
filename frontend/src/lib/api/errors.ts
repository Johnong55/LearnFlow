import axios from "axios";

import type { ApiError, ApiErrorResponse } from "@/types/api";

const FRIENDLY_MESSAGES: Record<string, string> = {
  ERR_NETWORK: "Không thể kết nối tới máy chủ. Hãy kiểm tra mạng và thử lại.",
  ECONNABORTED: "Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  INVALID_CREDENTIALS: "Email hoặc mật khẩu chưa đúng.",
  EMAIL_ALREADY_EXISTS: "Email này đã được sử dụng.",
};

export function normalizeApiError(error: unknown): ApiError {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return {
      code: "UNKNOWN_ERROR",
      message: "Đã có lỗi không mong muốn. Vui lòng thử lại.",
      details: [],
    };
  }

  const payload = error.response?.data;
  const code = payload?.error.code ?? error.code ?? "REQUEST_FAILED";
  const backendMessage = payload?.error.message;
  const friendlyMessage = FRIENDLY_MESSAGES[code];

  return {
    code,
    message:
      friendlyMessage ??
      backendMessage ??
      (error.response?.status === 503
        ? "Dịch vụ đang tạm gián đoạn. Vui lòng thử lại sau."
        : "Không thể hoàn tất yêu cầu. Vui lòng thử lại."),
    details: payload?.error.details ?? [],
    ...(payload?.meta.requestId ? { requestId: payload.meta.requestId } : {}),
    ...(error.response?.status ? { status: error.response.status } : {}),
  };
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value &&
    "details" in value
  );
}
