import { applyDecorators, SetMetadata } from '@nestjs/common';
import {
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

/**
 * Decorator key constants
 */
export const POPULATE_KEY = 'populate_relations';
export const SEARCH_FIELDS_KEY = 'search_fields';

// ═══════════════════════════════════════════
//  POPULATE DECORATOR
// ═══════════════════════════════════════════

/**
 * @Populate() - Decorator để chỉ định các relations cần eager load
 *
 * Sử dụng trên controller method hoặc class
 *
 * @example
 * ```ts
 * @Get(':id')
 * @Populate(['profile', 'posts', 'posts.comments'])
 * async getUser(@Param('id') id: number) { ... }
 * ```
 *
 * @param relations - Mảng tên relation cần load
 */
export const Populate = (relations: string[]) =>
  SetMetadata(POPULATE_KEY, relations);

// ═══════════════════════════════════════════
//  SEARCH FIELDS DECORATOR
// ═══════════════════════════════════════════

/**
 * @SearchFields() - Chỉ định các field được phép tìm kiếm
 *
 * @example
 * ```ts
 * @Get('page')
 * @SearchFields(['name', 'email', 'phone'])
 * async getPage(...) { ... }
 * ```
 */
export const SearchFields = (fields: string[]) =>
  SetMetadata(SEARCH_FIELDS_KEY, fields);

// ═══════════════════════════════════════════
//  COMBINED API DECORATORS
// ═══════════════════════════════════════════

/**
 * @ApiCrudOperation() - Gộp nhiều Swagger decorator cho CRUD endpoint
 *
 * @example
 * ```ts
 * @ApiCrudOperation('User', 'Lấy danh sách user')
 * @Get()
 * findAll() { ... }
 * ```
 */
export const ApiCrudOperation = (entityName: string, summary: string) =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: `[${entityName}] ${summary}` }),
    ApiResponse({ status: 200, description: 'Thành công' }),
    ApiResponse({ status: 401, description: 'Chưa xác thực' }),
    ApiResponse({ status: 403, description: 'Không có quyền' }),
  );

/**
 * @ApiPaginatedResponse() - Swagger decorator cho endpoint phân trang
 *
 * @example
 * ```ts
 * @Get('page')
 * @ApiPaginatedResponse('User')
 * getPage(...) { ... }
 * ```
 */
export const ApiPaginatedResponse = (entityName: string) =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: `[${entityName}] Phân trang` }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
    ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['ASC', 'DESC'],
      example: 'DESC',
    }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiResponse({ status: 200, description: 'Kết quả phân trang' }),
    ApiResponse({ status: 401, description: 'Chưa xác thực' }),
  );

/**
 * @ApiCreateResponse() - Swagger decorator cho endpoint tạo mới
 */
export const ApiCreateResponse = (entityName: string) =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: `[${entityName}] Tạo mới` }),
    ApiResponse({ status: 201, description: `${entityName} đã được tạo thành công` }),
    ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' }),
    ApiResponse({ status: 401, description: 'Chưa xác thực' }),
  );

/**
 * @ApiUpdateResponse() - Swagger decorator cho endpoint cập nhật
 */
export const ApiUpdateResponse = (entityName: string) =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: `[${entityName}] Cập nhật` }),
    ApiResponse({ status: 200, description: `${entityName} đã được cập nhật` }),
    ApiResponse({ status: 404, description: 'Không tìm thấy bản ghi' }),
    ApiResponse({ status: 401, description: 'Chưa xác thực' }),
  );

/**
 * @ApiDeleteResponse() - Swagger decorator cho endpoint xóa
 */
export const ApiDeleteResponse = (entityName: string) =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: `[${entityName}] Xóa` }),
    ApiResponse({ status: 200, description: `${entityName} đã được xóa` }),
    ApiResponse({ status: 404, description: 'Không tìm thấy bản ghi' }),
    ApiResponse({ status: 401, description: 'Chưa xác thực' }),
  );
