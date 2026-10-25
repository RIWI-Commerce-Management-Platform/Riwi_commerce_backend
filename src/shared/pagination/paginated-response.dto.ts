import { ApiProperty } from '@nestjs/swagger';
import {
  PaginatedResult,
  PaginationMeta,
} from './paginated-result.interface.js';

export class PaginationMetaDto implements PaginationMeta {
  @ApiProperty({
    example: 42,
    description: 'Total number of records matching criteria',
  })
  total: number;

  @ApiProperty({
    example: 1,
    description: 'Current page number',
  })
  page: number;

  @ApiProperty({
    example: 10,
    description: 'Maximum items per page',
  })
  limit: number;

  @ApiProperty({
    example: 5,
    description: 'Total number of pages',
  })
  totalPages: number;

  @ApiProperty({
    example: true,
    description: 'Indicates whether a next page exists',
  })
  hasNextPage: boolean;

  @ApiProperty({
    example: false,
    description: 'Indicates whether a previous page exists',
  })
  hasPreviousPage: boolean;

  constructor(meta: PaginationMeta) {
    this.total = meta.total;
    this.page = meta.page;
    this.limit = meta.limit;
    this.totalPages = meta.totalPages;
    this.hasNextPage = meta.hasNextPage;
    this.hasPreviousPage = meta.hasPreviousPage;
  }
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true, description: 'List of records' })
  data: T[];

  @ApiProperty({
    type: () => PaginationMetaDto,
    description: 'Pagination metadata',
  })
  meta: PaginationMetaDto;

  constructor(data: T[], meta: PaginationMeta) {
    this.data = data;
    this.meta = new PaginationMetaDto(meta);
  }

  static create<T, R>(
    result: PaginatedResult<T>,
    mapper: (item: T) => R,
  ): PaginatedResponseDto<R> {
    return new PaginatedResponseDto(result.data.map(mapper), result.meta);
  }
}
