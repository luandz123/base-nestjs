import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity.js';

/**
 * Ví dụ Entity sử dụng BaseEntity
 * Chỉ cần định nghĩa các field riêng, id + timestamps đã có sẵn
 */
@Entity('subjects')
export class Subject extends BaseEntity {
  @Column({ length: 200 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ type: 'int', default: 3 })
  credits: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;
}
