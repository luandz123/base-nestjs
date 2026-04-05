import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../common/base/base.repository.js';
import { Subject } from './entities/subject.entity.js';

/**
 * SubjectRepository - Kế thừa BaseRepository
 *
 * Đã có sẵn tất cả phương thức từ BaseRepository:
 *   getOne, getById, getMany, getPage,
 *   createOne, createMany,
 *   updateById, updateOne, updateMany,
 *   deleteById, softDeleteById, restoreById,
 *   exists, count
 *
 * Chỉ thêm phương thức custom nếu cần query phức tạp.
 */
@Injectable()
export class SubjectRepository extends BaseRepository<Subject> {
  constructor(
    @InjectRepository(Subject)
    repository: Repository<Subject>,
  ) {
    super(repository);
  }

  // ---- Custom query methods ----

  /**
   * Tìm theo mã môn học
   */
  async findByCode(code: string): Promise<Subject | null> {
    return this.getOne({ code });
  }

  /**
   * Lấy danh sách môn đang hoạt động (sắp xếp theo tên)
   */
  async findActive(): Promise<Subject[]> {
    return this.getMany({ isActive: true }, { order: { name: 'ASC' } });
  }
}
