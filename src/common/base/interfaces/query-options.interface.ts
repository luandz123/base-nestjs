/**
 * Interfaces cho Base CRUD System
 *
 * Tách rõ 2 tầng:
 * - Service layer: dùng plain object (không biết TypeORM)
 * - Repository layer: dùng TypeORM types nội bộ
 *
 * @see https://docs.nestjs.com/providers
 * @see https://typeorm.io/find-options
 */

// ═══════════════════════════════════════════
//  SERVICE LAYER - Plain object types
// ═══════════════════════════════════════════

/**
 * Condition - Điều kiện lọc đơn giản (plain object)
 * Dùng ở Service layer, không expose TypeORM types
 *
 * @example
 * { id: 1 }
 * { email: 'test@example.com', isActive: true }
 * { role: 'admin' }
 */
export type Condition<T> = Partial<Record<keyof T, any>>;

/**
 * Options cho các query ở Service layer
 * Không chứa TypeORM types - chỉ plain object
 */
export interface IFindOptions {
  /** Relations cần load (string array) */
  relations?: string[];
  /** Sắp xếp: { createdAt: 'DESC', name: 'ASC' } */
  order?: Record<string, 'ASC' | 'DESC'>;
  /** Chọn field cụ thể */
  select?: string[];
  /** Bật/tắt soft delete filter */
  withDeleted?: boolean;
}

/**
 * Options cho phân trang ở Service layer
 */
export interface IPageOptions extends IFindOptions {
  page?: number;
  limit?: number;
}

// ═══════════════════════════════════════════
//  RESPONSE TYPES
// ═══════════════════════════════════════════

/**
 * Kết quả phân trang chuẩn
 */
export interface IPaginatedResult<T> {
  data: T[];
  meta: {
    /** Trang hiện tại */
    page: number;
    /** Số bản ghi mỗi trang */
    limit: number;
    /** Tổng số bản ghi */
    totalItems: number;
    /** Tổng số trang */
    totalPages: number;
    /** Có trang trước không */
    hasPreviousPage: boolean;
    /** Có trang sau không */
    hasNextPage: boolean;
  };
}

/**
 * Response chuẩn cho tất cả API
 */
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, any>;
  statusCode?: number;
}
