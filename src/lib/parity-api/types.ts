export type ApiErrorCode =
  | "Unauthenticated"
  | "Unauthorized"
  | "RateLimited"
  | "ValidationError"
  | "UpstreamUnavailable"
  | "Unknown";

export type ApiError = {
  code: ApiErrorCode;
  message: string;
};

export type ApiResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: ApiError;
    };

export type UserDto = {
  id: string;
  email: string | null;
  name: string | null;
  imageUrl: string | null;
};

export type WorkspaceDto = {
  id: string;
  name: string;
};

export type PageDto = {
  id: string;
  workspaceId: string;
  title: string;
  icon: string | null;
  cover: string | null;
  content: string | null;
  calendarSyncEnabled: boolean;
  calendarEventId: string | null;
  createdAt: number;
};

export type V1Endpoint =
  | "/api/v1/auth/me"
  | "/api/v1/workspaces"
  | "/api/v1/pages"
  | "/api/v1/calendar/integration"
  | "/api/v1/calendar/events"
  | "/api/v1/ai/messages"
  | "/api/v1/usage";
