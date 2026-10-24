import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { UserRole } from '../../domain/user-role.enum.js';

export class AssignUserRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.DIRECTOR_REGIONAL })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Required when the role is DIRECTOR_REGIONAL',
  })
  @IsOptional()
  @IsInt()
  zoneId?: number;
}
