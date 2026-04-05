import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

/**
 * DatabaseExceptionFilter - Bắt tất cả lỗi database + HTTP
 *
 * Chuyển đổi lỗi TypeORM thành response có ý nghĩa:
 * - QueryFailedError (duplicate, foreign key, ...) → 400/409
 * - EntityNotFoundError → 404
 * - HttpException → giữ nguyên status
 * - Unknown errors → 500
 *
 * @see https://docs.nestjs.com/exception-filters
 * @see https://typeorm.io/repository-api#additional-options
 */
@Catch()
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Lỗi hệ thống, vui lòng thử lại sau';
    let error = 'Internal Server Error';

    // ─── NestJS HttpException ───
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as Record<string, any>;
        message = res.message || exception.message;
        error = res.error || error;

        // class-validator trả về mảng message
        if (Array.isArray(message)) {
          message = message.join('; ');
        }
      }
    }

    // ─── TypeORM: Query Failed (duplicate, constraint, ...) ───
    else if (exception instanceof QueryFailedError) {
      const driverError = (exception as any).driverError;
      const errorMessage = exception.message || '';

      // MSSQL: Violation of UNIQUE KEY constraint
      if (
        errorMessage.includes('UNIQUE') ||
        errorMessage.includes('duplicate') ||
        errorMessage.includes('Violation of UNIQUE KEY') ||
        driverError?.number === 2627 || // MSSQL unique constraint
        driverError?.number === 2601    // MSSQL unique index
      ) {
        statusCode = HttpStatus.CONFLICT;
        message = 'Dữ liệu đã tồn tại (trùng lặp)';
        error = 'Conflict';
      }
      // MSSQL: Foreign key constraint
      else if (
        errorMessage.includes('FOREIGN KEY') ||
        errorMessage.includes('REFERENCE') ||
        driverError?.number === 547 // MSSQL foreign key
      ) {
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Dữ liệu tham chiếu không hợp lệ (foreign key)';
        error = 'Bad Request';
      }
      // Other DB errors
      else {
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Lỗi truy vấn cơ sở dữ liệu';
        error = 'Bad Request';
      }

      this.logger.error(
        `Database Error: ${errorMessage}`,
        (exception as Error).stack,
      );
    }

    // ─── TypeORM: Entity Not Found ───
    else if (exception instanceof EntityNotFoundError) {
      statusCode = HttpStatus.NOT_FOUND;
      message = 'Không tìm thấy bản ghi';
      error = 'Not Found';
    }

    // ─── Unknown Error ───
    else {
      this.logger.error(
        `Unexpected Error: ${(exception as Error)?.message}`,
        (exception as Error)?.stack,
      );
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
