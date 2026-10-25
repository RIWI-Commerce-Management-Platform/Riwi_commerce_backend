import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { UserRole } from '../../../auth/domain/user-role.enum.js';

export class AssignUserRoleDto {
  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.DIRECTOR_REGIONAL,
  })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Required when the role is DIRECTOR_REGIONAL',
  })
  @IsOptional()
  // Form bodies send numbers as text; JSON numbers are left as they are.
  @Type(() => Number)
  @IsInt()
  zoneId?: number;
}
