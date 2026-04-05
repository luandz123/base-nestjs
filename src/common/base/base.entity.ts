import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

/**
 * BaseEntity - Entity cơ sở với các field chung
 *
 * Bao gồm:
 * - id (auto-generated)
 * - createdAt (auto timestamp khi tạo)
 * - updatedAt (auto timestamp khi cập nhật)
 *
 * Tham khảo:
 * - TypeORM Entity: https://typeorm.io/entities
 * - TypeORM Decorators: https://typeorm.io/decorator-reference
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * SoftDeleteBaseEntity - Entity cơ sở hỗ trợ soft delete
 *
 * Kế thừa BaseEntity, thêm deletedAt cho soft delete.
 * Sử dụng khi cần xóa mềm (đánh dấu đã xóa, không xóa thật).
 *
 * Ví dụ: User, Order, ... - các entity quan trọng không nên xóa vĩnh viễn
 */
export abstract class SoftDeleteBaseEntity extends BaseEntity {
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
