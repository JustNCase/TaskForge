export enum ErrorCode {
  VALIDATION = "VALIDATION_ERROR",
  AUTH = "AUTH_ERROR",
  NOT_FOUND = "NOT_FOUND",
  INTERNAL = "INTERNAL_ERROR",
  RATE_LIMIT = "RATE_LIMIT",
  VOICE = "VOICE_ERROR",
  AI = "AI_ERROR",
}

export class GenesisError extends Error {
  public code: ErrorCode;
  public statusCode: number;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "GenesisError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}
