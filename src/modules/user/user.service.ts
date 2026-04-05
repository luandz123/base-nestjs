import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto.js';
import * as bcrypt from 'bcrypt';
import { BaseService } from '../../common/base/base.service.js';
import { User } from './entities/user.entity.js';
import { UserRepository } from './user.repository.js';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(
    private readonly userRepository: UserRepository,
    dataSource: DataSource,
  ) {
    super(userRepository, dataSource);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return this.createOne({
      ...createUserDto,
      password: hashedPassword,
    });
  }
}
