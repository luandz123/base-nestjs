import {
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ObjectLiteral } from 'typeorm';
import { BaseService } from './base.service.js';
import { PaginationDto } from './dto/pagination.dto.js';

/**
 * BaseController - Controller cơ sở (pure routing)
 *
 * TRÁCH NHIỆM (theo SOLID - Single Responsibility):
 *   ✅ Nhận HTTP request
 *   ✅ Gọi service method tương ứng
 *   ✅ Trả HTTP response
 *   ❌ KHÔNG chứa business logic
 *   ❌ KHÔNG parse JSON, build object
 *   ❌ KHÔNG import TypeORM types
 *
 * ROUTES CÓ SẴN (không cần DTO):
 *   GET    /           → getAll
 *   GET    /page       → getPage (phân trang)
 *   GET    /count      → count
 *   GET    /:id        → getById
 *   DELETE /:id        → deleteById
 *
 * ROUTES CẦN CHILD OVERRIDE (cần DTO cụ thể):
 *   POST   /           → createOne   ← child viết với CreateDto
 *   POST   /bulk       → createMany  ← child viết với CreateDto[]
 *   PATCH  /:id        → updateById  ← child viết với UpdateDto
 *
 * @example
 * ```ts
 * @ApiTags('Subject')
 * @Controller('subject')
 * export class SubjectController extends BaseController<Subject> {
 *   constructor(private readonly subjectService: SubjectService) {
 *     super(subjectService);
 *   }
 *
 *   @Post()
 *   create(@Body() dto: CreateSubjectDto) {
 *     return this.baseService.createOne(dto);
 *   }
 *
 *   @Patch(':id')
 *   update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSubjectDto) {
 *     return this.baseService.updateById(id, dto);
 *   }
 * }
 * ```
 *
 * @see https://docs.nestjs.com/controllers
 * @see https://docs.nestjs.com/openapi/introduction
 *
 * @template T - Entity type
 */
export abstract class BaseController<T extends ObjectLiteral> {
  constructor(protected readonly baseService: BaseService<T>) {}

  // ═══════════════════════════════════════════
  //  READ
  // ═══════════════════════════════════════════

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả bản ghi' })
  @ApiResponse({ status: 200, description: 'Danh sách bản ghi' })
  async getAll(): Promise<T[]> {
    return this.baseService.getMany();
  }

  @Get('page')
  @ApiOperation({ summary: 'Phân trang bản ghi' })
  @ApiResponse({ status: 200, description: 'Kết quả phân trang' })
  async getPage(@Query() paginationDto: PaginationDto) {
    return this.baseService.getPage({
      page: paginationDto.page,
      limit: paginationDto.limit,
      order: paginationDto.sortBy
        ? { [paginationDto.sortBy]: paginationDto.sortOrder || 'DESC' }
        : undefined,
    });
  }

  @Get('count')
  @ApiOperation({ summary: 'Đếm số bản ghi' })
  @ApiResponse({ status: 200, description: 'Số lượng bản ghi' })
  async count(): Promise<{ count: number }> {
    const result = await this.baseService.count();
    return { count: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy bản ghi theo ID' })
  @ApiParam({ name: 'id', description: 'ID bản ghi', type: Number })
  @ApiResponse({ status: 200, description: 'Chi tiết bản ghi' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bản ghi' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<T> {
    return this.baseService.getById(id);
  }

  // ═══════════════════════════════════════════
  //  DELETE
  // ═══════════════════════════════════════════

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bản ghi theo ID' })
  @ApiParam({ name: 'id', description: 'ID bản ghi', type: Number })
  @ApiResponse({ status: 200, description: 'Bản ghi đã được xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bản ghi' })
  async deleteById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ deleted: boolean }> {
    const deleted = await this.baseService.deleteById(id);
    return { deleted };
  }
}
