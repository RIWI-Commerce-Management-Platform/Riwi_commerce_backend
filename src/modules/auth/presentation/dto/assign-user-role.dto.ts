import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../domain/user-role.enum.js';

export class AssignUserRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.DIRECTOR_REGIONAL })
  role!: UserRole;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Required when the role is DIRECTOR_REGIONAL',
  })
  zoneId?: number;
}
