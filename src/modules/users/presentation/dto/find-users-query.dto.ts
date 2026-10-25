import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../shared/pagination/pagination-query.dto.js';
import { UserRole } from '../../../auth/domain/user-role.enum.js';

export class FindUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: UserRole,
    enumName: 'UserRole',
    description: 'Only users with this role',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: 1, description: 'Zone of the director' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  zoneId?: number;

  @ApiPropertyOptional({
    description: 'Search by name or email',
    example: 'laura',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
