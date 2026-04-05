import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity.js';
import { SubjectRepository } from './subject.repository.js';
import { SubjectService } from './subject.service.js';
import { SubjectController } from './subject.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Subject])],
  controllers: [SubjectController],
  providers: [SubjectRepository, SubjectService],
  exports: [SubjectService],
})
export class SubjectModule {}
