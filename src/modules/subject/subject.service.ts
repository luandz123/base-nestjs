import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, DeepPartial } from 'typeorm';
import { BaseService } from '../../common/base/base.service.js';
import { Subject } from './entities/subject.entity.js';
import { SubjectRepository } from './subject.repository.js';

/**
 * SubjectService - Kế thừa BaseService
 *
 * Đã có sẵn tất cả methods:
 *   createOne, createMany,
 *   getOne, findOne, getById, getMany, getPage,
 *   updateById, updateOne, updateMany,
 *   deleteById, deleteMany, softDeleteById, restoreById,
 *   exists, count
 *
 * Chỉ override khi cần thêm business logic riêng.
 */
@Injectable()
export class SubjectService extends BaseService<Subject> {
  constructor(
    private readonly subjectRepository: SubjectRepository,
    dataSource: DataSource,
  ) {
    super(subjectRepository, dataSource);
  }

  // ---- Override createOne để thêm validation ----

  async createOne(data: DeepPartial<Subject>): Promise<Subject> {
    // Kiểm tra mã môn học đã tồn tại chưa
    if (data.code) {
      const isDuplicate = await this.exists({ code: data.code as string });
      if (isDuplicate) {
        throw new BadRequestException(
          `Mã môn học "${data.code}" đã tồn tại`,
        );
      }
    }
    return super.createOne(data);
  }

  // ---- Phương thức riêng ----

  /**
   * Lấy danh sách môn học đang hoạt động
   */
  async getActiveSubjects(): Promise<Subject[]> {
    return this.subjectRepository.findActive();
  }

  /**
   * Tìm môn học theo mã
   */
  async getByCode(code: string): Promise<Subject | null> {
    return this.findOne({ code });
  }
}
