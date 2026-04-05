import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Response chuẩn cho tất cả API
 */
export interface IStandardResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: Record<string, any>;
  timestamp: string;
}

/**
 * ResponseInterceptor - Bọc tất cả response thành format chuẩn
 *
 * Input (từ controller):
 *   { id: 1, name: 'Test' }
 *   hoặc { data: [...], meta: { page: 1, ... } }
 *
 * Output (trả về client):
 *   {
 *     success: true,
 *     statusCode: 200,
 *     message: 'Thành công',
 *     data: { id: 1, name: 'Test' },
 *     timestamp: '2026-04-05T...'
 *   }
 *
 * Nếu response có dạng paginated ({ data, meta }):
 *   {
 *     success: true,
 *     statusCode: 200,
 *     message: 'Thành công',
 *     data: [...],
 *     meta: { page: 1, limit: 10, totalItems: 100, ... },
 *     timestamp: '2026-04-05T...'
 *   }
 *
 * @see https://docs.nestjs.com/interceptors
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, IStandardResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IStandardResponse<T>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((responseData) => {
        // Nếu response đã có dạng paginated { data, meta }
        if (
          responseData &&
          typeof responseData === 'object' &&
          'data' in responseData &&
          'meta' in responseData
        ) {
          return {
            success: true,
            statusCode,
            message: 'Thành công',
            data: responseData.data,
            meta: responseData.meta,
            timestamp: new Date().toISOString(),
          };
        }

        // Response bình thường
        return {
          success: true,
          statusCode,
          message: 'Thành công',
          data: responseData,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
