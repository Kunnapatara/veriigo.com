/**
 * VERIIGO - Custom Application Error Classes & Formatters
 */

import { HTTP_STATUS } from '../constants';
import { ApiResponse } from '../types';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'ข้อมูลไม่ถูกต้องตามรูปแบบ', details?: any) {
    super(message, HTTP_STATUS.BAD_REQUEST, 'VALIDATION_ERROR', details);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'ไม่มีสิทธิ์เข้าถึงข้อมูล กรุณาลงชื่อเข้าใช้', details?: any) {
    super(message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'สิทธิ์ของคุณไม่เพียงพอสำหรับการดำเนินการนี้', details?: any) {
    super(message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'ไม่พบข้อมูลที่ต้องการ', details?: any) {
    super(message, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล', details?: any) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'DATABASE_ERROR', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'การทำรายการเกินโควต้าที่กำหนด กรุณาลองใหม่ในภายหลัง', details?: any) {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED', details);
  }
}

/**
 * Global Error Response Formatter for API Routes
 */
export const formatErrorResponse = (err: unknown): { statusCode: number; body: ApiResponse } => {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      body: {
        success: false,
        error: {
          code: err.errorCode,
          message: err.message,
          details: err.details,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
    };
  }

  const errorObj = err instanceof Error ? err : new Error(String(err));
  return {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    body: {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: errorObj.message || 'เกิดข้อผิดพลาดของระบบ',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
  };
};
