import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../domain/user-role.enum.js';

export class AssignUserRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.DIRECTOR_REGIONAL })
  role!: UserRole;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Obligatoria cuando el rol es DIRECTOR_REGIONAL',
  })
  zoneId?: string;
}
