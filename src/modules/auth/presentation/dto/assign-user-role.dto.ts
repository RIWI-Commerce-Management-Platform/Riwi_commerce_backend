import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../domain/user-role.enum.js';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class AssignUserRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.ADMINISTRADOR })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Required when the role is DIRECTOR_REGIONAL',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  zoneId?: number;
}
