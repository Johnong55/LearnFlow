import { AxiosError, AxiosHeaders } from "axios";

import { normalizeApiError } from "@/lib/api/errors";
import type { ApiErrorResponse } from "@/types/api";

describe("normalizeApiError", () => {
  it("normalizes backend errors without exposing raw Axios details", () => {
    const data: ApiErrorResponse = {
      success: false,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Internal provider wording",
      },
      meta: { requestId: "request-123", timestamp: "2026-07-30T00:00:00.000Z" },
    };
    const error = new AxiosError(
      "Request failed",
      "ERR_BAD_REQUEST",
      { headers: new AxiosHeaders() },
      undefined,
      {
        data,
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    );

    expect(normalizeApiError(error)).toEqual({
      code: "INVALID_CREDENTIALS",
      message: "Email hoặc mật khẩu chưa đúng.",
      details: [],
      requestId: "request-123",
      status: 401,
    });
  });

  it("provides a safe message for unknown errors", () => {
    expect(normalizeApiError(new Error("secret stack detail"))).toEqual({
      code: "UNKNOWN_ERROR",
      message: "Đã có lỗi không mong muốn. Vui lòng thử lại.",
      details: [],
    });
  });
});
