import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * DTO chung cho phân trang
 * Sử dụng query params: ?page=1&limit=10&sortBy=createdAt&sortOrder=DESC
 *
 * Tham khảo:
 * - NestJS Docs: https://docs.nestjs.com/openapi/types-and-parameters
 * - class-validator: https://github.com/typestack/class-validator
 * - class-transformer: https://github.com/typestack/class-transformer
 */
export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Số trang (bắt đầu từ 1)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Số bản ghi mỗi trang',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Trường sắp xếp',
    example: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    example: 'DESC',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm',
    example: '',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
