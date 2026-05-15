import { NextResponse } from "next/server";

import type { ApiErrorCode, ApiResult } from "./types";

export function ok<T>(data: T) {
  return NextResponse.json<ApiResult<T>>({
    ok: true,
    data,
  });
}

export function err(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json<ApiResult<never>>(
    {
      ok: false,
      error: { code, message },
    },
    { status },
  );
}
