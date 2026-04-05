import {
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, DeepPartial, ObjectLiteral } from 'typeorm';
import { BaseRepository } from './base.repository.js';
import type {
  Condition,
  IFindOptions,
  IPageOptions,
  IPaginatedResult,
} from './interfaces/query-options.interface.js';
import { TransactionHelper } from '../helpers/transaction.helper.js';

/**
 * BaseService - Service cơ sở cho tất cả module
 *
 * TRÁCH NHIỆM (theo SOLID - Single Responsibility):
 *   ✅ Business logic & validation
 *   ✅ Gọi repository methods với condition đơn giản
 *   ✅ Throw HTTP exceptions (NotFoundException, BadRequestException)
 *   ✅ Điều phối transaction cho write operations
 *   ❌ KHÔNG viết query TypeORM trực tiếp
 *   ❌ KHÔNG import TypeORM FindOptions types
 *   ❌ KHÔNG xử lý request/response HTTP (controller làm)
 *
 * CÁCH SỬ DỤNG:
 *   - getOne({ id: 1 })
 *   - getOne({ email: 'test@test.com' })
 *   - getMany({ isActive: true }, { relations: ['posts'], order: { name: 'ASC' } })
 *   - getPage({ page: 1, limit: 10 }, { role: 'admin' })
 *   - createOne({ name: 'Test', email: 'a@b.com' })
 *   - updateById(1, { name: 'Updated' })
 *
 * @see https://docs.nestjs.com/providers
 * @see https://docs.nestjs.com/exception-filters
 *
 * @template T - Entity type
 */
export abstract class BaseService<T extends ObjectLiteral> {
  protected readonly logger: Logger;
  protected readonly transactionHelper: TransactionHelper;

  constructor(
    protected readonly baseRepository: BaseRepository<T>,
    protected readonly dataSource: DataSource,
  ) {
    this.logger = new Logger(this.constructor.name);
    this.transactionHelper = new TransactionHelper(dataSource);
  }

  // ═══════════════════════════════════════════
  //  CREATE
  // ═══════════════════════════════════════════

  /**
   * Tạo một bản ghi mới (trong transaction)
   * Override method này để thêm validation trước khi tạo
   *
   * @example
   * await this.createOne({ name: 'Test', email: 'a@b.com' });
   */
  async createOne(data: DeepPartial<T>): Promise<T> {
    return this.transactionHelper.run(async () => {
      return this.baseRepository.createOne(data);
    });
  }

  /**
   * Tạo nhiều bản ghi (trong transaction)
   *
   * @example
   * await this.createMany([{ name: 'A' }, { name: 'B' }]);
   */
  async createMany(data: DeepPartial<T>[]): Promise<T[]> {
    if (!data || data.length === 0) {
      throw new BadRequestException('Dữ liệu tạo mới không được để trống');
    }
    return this.transactionHelper.run(async () => {
      return this.baseRepository.createMany(data);
    });
  }

  // ═══════════════════════════════════════════
  //  READ
  // ═══════════════════════════════════════════

  /**
   * Lấy một bản ghi theo condition
   * @throws NotFoundException nếu không tìm thấy
   *
   * @example
   * await this.getOne({ id: 1 });
   * await this.getOne({ email: 'test@test.com' });
   * await this.getOne({ id: 1 }, { relations: ['profile'] });
   */
  async getOne(condition: Condition<T>, options?: IFindOptions): Promise<T> {
    const entity = await this.baseRepository.getOne(condition, options);
    if (!entity) {
      throw new NotFoundException('Không tìm thấy bản ghi');
    }
    return entity;
  }

  /**
   * Tìm một bản ghi (không throw, trả null nếu không có)
   *
   * @example
   * const user = await this.findOne({ email: 'test@test.com' });
   * if (!user) { ... }
   */
  async findOne(
    condition: Condition<T>,
    options?: IFindOptions,
  ): Promise<T | null> {
    return this.baseRepository.getOne(condition, options);
  }

  /**
   * Lấy bản ghi theo ID
   * @throws NotFoundException nếu không tìm thấy
   *
   * @example
   * await this.getById(1);
   * await this.getById(1, { relations: ['posts', 'profile'] });
   */
  async getById(
    id: number | string,
    options?: IFindOptions,
  ): Promise<T> {
    const entity = await this.baseRepository.getById(id, options);
    if (!entity) {
      throw new NotFoundException(`Không tìm thấy bản ghi với ID: ${id}`);
    }
    return entity;
  }

  /**
   * Lấy nhiều bản ghi theo condition
   *
   * @example
   * await this.getMany();                                    // lấy tất cả
   * await this.getMany({ isActive: true });                  // lọc theo condition
   * await this.getMany({ role: 'admin' }, { order: { name: 'ASC' } });
   * await this.getMany(undefined, { relations: ['posts'] }); // tất cả + relations
   */
  async getMany(
    condition?: Condition<T>,
    options?: IFindOptions,
  ): Promise<T[]> {
    return this.baseRepository.getMany(condition, options);
  }

  /**
   * Phân trang
   *
   * @example
   * await this.getPage({ page: 1, limit: 10 });
   * await this.getPage(
   *   { page: 1, limit: 10, order: { createdAt: 'DESC' } },
   *   { isActive: true },
   * );
   * await this.getPage(
   *   { page: 1, limit: 5, relations: ['department'] },
   *   { role: 'student' },
   * );
   */
  async getPage(
    pageOptions: IPageOptions,
    condition?: Condition<T>,
  ): Promise<IPaginatedResult<T>> {
    return this.baseRepository.getPage(pageOptions, condition);
  }

  // ═══════════════════════════════════════════
  //  UPDATE
  // ═══════════════════════════════════════════

  /**
   * Cập nhật theo ID (trong transaction)
   * @throws NotFoundException nếu không tìm thấy
   *
   * @example
   * await this.updateById(1, { name: 'Updated Name' });
   */
  async updateById(id: number | string, data: DeepPartial<T>): Promise<T> {
    await this.getById(id); // kiểm tra tồn tại
    return this.transactionHelper.run(async () => {
      const updated = await this.baseRepository.updateById(id, data);
      if (!updated) {
        throw new NotFoundException(`Không tìm thấy bản ghi với ID: ${id}`);
      }
      return updated;
    });
  }

  /**
   * Cập nhật bản ghi đầu tiên khớp condition (trong transaction)
   * @throws NotFoundException nếu không tìm thấy
   *
   * @example
   * await this.updateOne({ email: 'old@test.com' }, { email: 'new@test.com' });
   */
  async updateOne(
    condition: Condition<T>,
    data: DeepPartial<T>,
  ): Promise<T> {
    await this.getOne(condition); // kiểm tra tồn tại
    return this.transactionHelper.run(async () => {
      const updated = await this.baseRepository.updateOne(condition, data);
      if (!updated) {
        throw new NotFoundException('Không tìm thấy bản ghi sau khi cập nhật');
      }
      return updated;
    });
  }

  /**
   * Cập nhật nhiều bản ghi (trong transaction)
   *
   * @example
   * await this.updateMany({ isActive: false }, { isActive: true });
   */
  async updateMany(
    condition: Condition<T>,
    data: DeepPartial<T>,
  ): Promise<number> {
    return this.transactionHelper.run(async () => {
      return this.baseRepository.updateMany(condition, data);
    });
  }

  // ═══════════════════════════════════════════
  //  DELETE
  // ═══════════════════════════════════════════

  /**
   * Xóa bản ghi theo ID (trong transaction)
   * @throws NotFoundException nếu không tìm thấy
   *
   * @example
   * await this.deleteById(1);
   */
  async deleteById(id: number | string): Promise<boolean> {
    await this.getById(id); // kiểm tra tồn tại
    return this.transactionHelper.run(async () => {
      return this.baseRepository.deleteById(id);
    });
  }

  /**
   * Xóa nhiều bản ghi (trong transaction)
   *
   * @example
   * await this.deleteMany({ isActive: false });
   */
  async deleteMany(condition: Condition<T>): Promise<number> {
    return this.transactionHelper.run(async () => {
      return this.baseRepository.deleteMany(condition);
    });
  }

  /**
   * Soft delete theo ID (trong transaction)
   * @throws NotFoundException nếu không tìm thấy
   */
  async softDeleteById(id: number | string): Promise<boolean> {
    await this.getById(id);
    return this.transactionHelper.run(async () => {
      return this.baseRepository.softDeleteById(id);
    });
  }

  /**
   * Khôi phục bản ghi đã soft delete
   */
  async restoreById(id: number | string): Promise<boolean> {
    return this.transactionHelper.run(async () => {
      return this.baseRepository.restoreById(id);
    });
  }

  // ═══════════════════════════════════════════
  //  UTILITY
  // ═══════════════════════════════════════════

  /**
   * Kiểm tra bản ghi tồn tại
   *
   * @example
   * const emailExists = await this.exists({ email: 'test@test.com' });
   */
  async exists(condition: Condition<T>): Promise<boolean> {
    return this.baseRepository.exists(condition);
  }

  /**
   * Đếm số bản ghi
   *
   * @example
   * const total = await this.count();
   * const activeCount = await this.count({ isActive: true });
   */
  async count(condition?: Condition<T>): Promise<number> {
    return this.baseRepository.count(condition);
  }
}
