export class ApiResponse<T> {
  status: string;
  data: T | null;
  message: string;
  meta?: Record<string, any>;

  constructor(
    status: "success" | "error",
    data: T | null = null,
    message: string = "",
    meta?: Record<string, any>
  ) {
    this.status = status;
    this.data = data;
    this.message = message;
    this.meta = meta;
  }

  static success<T>(
    data: T,
    message = "Operation successful",
    meta?: Record<string, any>
  ) {
    return new ApiResponse<T>("success", data, message, meta);
  }

  static error(message: string, meta?: Record<string, any>) {
    return new ApiResponse<null>("error", null, message, meta);
  }
}
