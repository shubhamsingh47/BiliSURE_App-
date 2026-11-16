import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string, pagination?: ApiResponse['pagination']): void {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    message,
    pagination,
  };
  res.status(statusCode).json(payload);
}

export function sendError(res: Response, statusCode: number, message: string, code = 'ERROR', details?: any): void {
  const payload: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
  res.status(statusCode).json(payload);
}
