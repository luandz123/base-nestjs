import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import type {
  Condition,
  IFindOptions,
  IPageOptions,
  IPaginatedResult,
} from './interfaces/query-options.interface.js';

/**
 * BaseRepository - Repository cơ sở cho tất cả entity
 *
 * TRÁCH NHIỆM (theo SOLID - Single Responsibility):
 *   ✅ Sở hữu toàn bộ logic query TypeORM
 *   ✅ Chuyển đổi plain condition → TypeORM FindOptionsWhere
 *   ✅ Chuyển đổi IFindOptions → TypeORM FindManyOptions
 *   ✅ Try-catch cho các thao tác database
 *   ✅ Cung cấp transaction support
 *   ❌ KHÔNG chứa business logic
 *   ❌ KHÔNG throw HTTP exceptions (service làm việc đó)
 *
 * @see https://typeorm.io/repository-api
 * @see https://typeorm.io/find-options
 * @see https://docs.nestjs.com/techniques/database
 *
 * @template T - Entity type kế thừa từ ObjectLiteral
 */
export class BaseRepository<T extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  // ═══════════════════════════════════════════
  //  CREATE
  // ═══════════════════════════════════════════

  /**
   * Tạo một bản ghi mới
   */
  async createOne(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  /**
   * Tạo nhiều bản ghi cùng lúc
   */
  async createMany(data: DeepPartial<T>[]): Promise<T[]> {
    const entities = this.repository.create(data);
    return this.repository.save(entities);
  }

  // ═══════════════════════════════════════════
  //  READ
  // ═══════════════════════════════════════════

  /**
   * Tìm một bản ghi theo điều kiện
   * @param condition - Điều kiện plain object: { id: 1 } hoặc { email: 'x@y.com' }
   * @param options - Relations, order, select...
   */
  async getOne(
    condition: Condition<T>,
    options?: IFindOptions,
  ): Promise<T | null> {
    const findOptions = this.buildFindOneOptions(condition, options);
    return this.repository.findOne(findOptions);
  }

  /**
   * Tìm bản ghi theo ID
   */
  async getById(
    id: number | string,
    options?: IFindOptions,
  ): Promise<T | null> {
    return this.getOne({ id } as Condition<T>, options);
  }

  /**
   * Tìm nhiều bản ghi theo điều kiện
   * @param condition - Điều kiện (optional, không truyền = lấy tất cả)
   * @param options - Relations, order, select...
   */
  async getMany(
    condition?: Condition<T>,
    options?: IFindOptions,
  ): Promise<T[]> {
    const findOptions = this.buildFindManyOptions(condition, options);
    return this.repository.find(findOptions);
  }

  /**
   * Phân trang
   * @param pageOptions - { page, limit, order, relations, ... }
   * @param condition - Điều kiện lọc (optional)
   */
  async getPage(
    pageOptions: IPageOptions,
    condition?: Condition<T>,
  ): Promise<IPaginatedResult<T>> {
    const { page = 1, limit = 10, ...findOpts } = pageOptions;
    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions<T> = {
      ...this.buildFindManyOptions(condition, findOpts),
      skip,
      take: limit,
    };

    const [data, totalItems] = await this.repository.findAndCount(findOptions);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    };
  }

  // ═══════════════════════════════════════════
  //  UPDATE
  // ═══════════════════════════════════════════

  /**
   * Cập nhật bản ghi theo ID
   * @returns Bản ghi sau khi update hoặc null
   */
  async updateById(
    id: number | string,
    data: DeepPartial<T>,
  ): Promise<T | null> {
    const where = { id } as unknown as FindOptionsWhere<T>;
    await this.repository.update(where, data as any);
    return this.getById(id);
  }

  /**
   * Cập nhật bản ghi đầu tiên khớp điều kiện
   */
  async updateOne(
    condition: Condition<T>,
    data: DeepPartial<T>,
  ): Promise<T | null> {
    const where = condition as FindOptionsWhere<T>;
    await this.repository.update(where, data as any);
    return this.getOne(condition);
  }

  /**
   * Cập nhật nhiều bản ghi theo điều kiện
   * @returns Số bản ghi đã cập nhật
   */
  async updateMany(
    condition: Condition<T>,
    data: DeepPartial<T>,
  ): Promise<number> {
    const where = condition as FindOptionsWhere<T>;
    const result = await this.repository.update(where, data as any);
    return result.affected ?? 0;
  }

  // ═══════════════════════════════════════════
  //  DELETE
  // ═══════════════════════════════════════════

  /**
   * Xóa bản ghi theo ID (hard delete)
   */
  async deleteById(id: number | string): Promise<boolean> {
    const where = { id } as unknown as FindOptionsWhere<T>;
    const result = await this.repository.delete(where);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Xóa nhiều bản ghi theo điều kiện
   */
  async deleteMany(condition: Condition<T>): Promise<number> {
    const where = condition as FindOptionsWhere<T>;
    const result = await this.repository.delete(where);
    return result.affected ?? 0;
  }

  /**
   * Soft delete bản ghi theo ID
   * Entity cần có @DeleteDateColumn()
   */
  async softDeleteById(id: number | string): Promise<boolean> {
    const where = { id } as unknown as FindOptionsWhere<T>;
    const result = await this.repository.softDelete(where);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Khôi phục bản ghi đã soft delete
   */
  async restoreById(id: number | string): Promise<boolean> {
    const where = { id } as unknown as FindOptionsWhere<T>;
    const result = await this.repository.restore(where);
    return (result.affected ?? 0) > 0;
  }

  // ═══════════════════════════════════════════
  //  UTILITY
  // ═══════════════════════════════════════════

  /**
   * Kiểm tra bản ghi có tồn tại hay không
   */
  async exists(condition: Condition<T>): Promise<boolean> {
    const where = condition as FindOptionsWhere<T>;
    const count = await this.repository.count({ where });
    return count > 0;
  }

  /**
   * Đếm số bản ghi
   */
  async count(condition?: Condition<T>): Promise<number> {
    const where = condition
      ? (condition as FindOptionsWhere<T>)
      : undefined;
    return this.repository.count({ where });
  }

  /**
   * Lấy QueryBuilder cho query phức tạp
   */
  createQueryBuilder(alias?: string): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(alias);
  }

  /**
   * Lấy EntityManager (cho transaction)
   */
  getManager(): EntityManager {
    return this.repository.manager;
  }

  /**
   * Lấy TypeORM Repository gốc
   */
  getRepository(): Repository<T> {
    return this.repository;
  }

  // ═══════════════════════════════════════════
  //  PRIVATE HELPERS - Chuyển đổi types
  // ═══════════════════════════════════════════

  /**
   * Chuyển plain condition + IFindOptions → TypeORM FindOneOptions
   */
  protected buildFindOneOptions(
    condition?: Condition<T>,
    options?: IFindOptions,
  ): FindOneOptions<T> {
    const findOptions: FindOneOptions<T> = {};

    if (condition && Object.keys(condition).length > 0) {
      findOptions.where = condition as FindOptionsWhere<T>;
    }

    if (options?.relations) {
      findOptions.relations = this.parseRelations(options.relations);
    }

    if (options?.order) {
      findOptions.order = options.order as any;
    }

    if (options?.select) {
      findOptions.select = options.select as any;
    }

    if (options?.withDeleted) {
      findOptions.withDeleted = options.withDeleted;
    }

    return findOptions;
  }

  /**
   * Chuyển plain condition + IFindOptions → TypeORM FindManyOptions
   */
  protected buildFindManyOptions(
    condition?: Condition<T>,
    options?: IFindOptions,
  ): FindManyOptions<T> {
    return this.buildFindOneOptions(condition, options) as FindManyOptions<T>;
  }

  /**
   * Chuyển string[] relations → TypeORM relations object
   * Ví dụ: ['profile', 'posts.comments'] → { profile: true, posts: { comments: true } }
   */
  protected parseRelations(relations: string[]): Record<string, any> {
    const result: Record<string, any> = {};

    for (const relation of relations) {
      const parts = relation.split('.');
      let current = result;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          current[part] = true;
        } else {
          if (typeof current[part] !== 'object') {
            current[part] = {};
          }
          current = current[part];
        }
      }
    }

    return result;
  }
}
