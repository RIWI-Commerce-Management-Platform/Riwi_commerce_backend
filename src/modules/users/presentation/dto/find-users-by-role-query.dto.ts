import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../shared/pagination/pagination-query.dto.js';

export class FindUsersByRoleQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by name or email',
    example: 'laura',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
