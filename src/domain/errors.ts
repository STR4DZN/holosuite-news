export type HoloNewsErrorCode = "NEWSPAPER_PERMISSION_DENIED" | "NEWSPAPER_NOT_FOUND" | "NEWSPAPER_INVALID_DATA" | "NEWSPAPER_STORAGE_ERROR" | "NEWSPAPER_INTEGRATION_ERROR" | "NEWSPAPER_MIGRATION_ERROR" | "NEWSPAPER_REVISION_CONFLICT";

export class HoloNewsError extends Error {
  readonly code: HoloNewsErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: HoloNewsErrorCode, message: string, details?: Record<string, unknown>) {
    super(`${code}: ${message}`);
    this.name = "HoloNewsError";
    this.code = code;
    this.details = details;
  }
}
