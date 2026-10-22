import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAdvisorDto {
  @ApiPropertyOptional({ example: 'Ana Pérez' })
  nombre?: string;

  @ApiPropertyOptional({ example: 'ana.perez@example.com' })
  correo?: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  telefono?: string;

  @ApiPropertyOptional({ description: 'ID of the linked Better Auth user' })
  idUsuario?: string;
}
