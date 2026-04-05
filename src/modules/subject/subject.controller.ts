import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BaseController } from '../../common/base/base.controller.js';
import { Subject } from './entities/subject.entity.js';
import { SubjectService } from './subject.service.js';
import { CreateSubjectDto } from './dto/create-subject.dto.js';
import { UpdateSubjectDto } from './dto/update-subject.dto.js';

/**
 * SubjectController - Kế thừa BaseController
 *
 * Routes tự động từ BaseController:
 *   GET    /subject           → getAll
 *   GET    /subject/page      → getPage (phân trang)
 *   GET    /subject/count     → count
 *   GET    /subject/:id       → getById
 *   DELETE /subject/:id       → deleteById
 *
 * Routes tự định nghĩa (với DTO cho Swagger):
 *   POST   /subject           → create    (CreateSubjectDto)
 *   PATCH  /subject/:id       → update    (UpdateSubjectDto)
 *
 * Routes custom riêng:
 *   GET    /subject/active    → getActiveSubjects
 */
@ApiTags('Subject')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@Controller('subject')
export class SubjectController extends BaseController<Subject> {
  constructor(private readonly subjectService: SubjectService) {
    super(subjectService);
  }

  // ─── CREATE (với DTO cụ thể) ───

  @Post()
  @ApiOperation({ summary: 'Tạo môn học mới' })
  @ApiResponse({ status: 201, description: 'Môn học đã được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  async create(@Body() dto: CreateSubjectDto): Promise<Subject> {
    return this.subjectService.createOne(dto);
  }

  // ─── UPDATE (với DTO cụ thể) ───

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật môn học theo ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Môn học đã được cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy môn học' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubjectDto,
  ): Promise<Subject> {
    return this.subjectService.updateById(id, dto);
  }

  // ─── CUSTOM ROUTES ───

  @Get('active')
  @ApiOperation({ summary: 'Lấy danh sách môn học đang hoạt động' })
  async getActiveSubjects(): Promise<Subject[]> {
    return this.subjectService.getActiveSubjects();
  }
}
