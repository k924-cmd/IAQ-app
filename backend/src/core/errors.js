export class PublicError extends Error {
  constructor(code, message, { retryable = false, requestId = "unknown" } = {}) {
    super(message);
    this.name = "PublicError";
    this.code = code;
    this.retryable = retryable;
    this.requestId = requestId;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      requestId: this.requestId,
    };
  }
}

export const publicError = (code, message, options) => new PublicError(code, message, options);

export function safePublicError(error, requestId) {
  if (error instanceof PublicError) {
    error.requestId = requestId;
    return error;
  }
  return new PublicError("INTERNAL_ERROR", "服务暂时不可用，请稍后重试。", {
    retryable: true,
    requestId,
  });
}
