import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../domain/user.entity.js';
import { UserRole } from '../../../auth/domain/user-role.enum.js';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Laura Martinez' })
  name: string;

  @ApiProperty({ example: 'laura.martinez@comercial360.co' })
  email: string;

  @ApiProperty({ example: false })
  emailVerified: boolean;

  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.ASESOR,
  })
  role: UserRole;

  @ApiPropertyOptional({
    example: 1,
    nullable: true,
    description: 'Set only for regional directors',
  })
  zoneId: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.emailVerified = user.emailVerified;
    this.role = user.role;
    this.zoneId = user.zoneId;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
