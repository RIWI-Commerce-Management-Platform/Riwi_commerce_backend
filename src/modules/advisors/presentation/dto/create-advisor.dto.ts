import { ApiProperty } from '@nestjs/swagger';

export class CreateAdvisorDto {
  @ApiProperty({ example: 'Ana Pérez' })
  nombre!: string;

  @ApiProperty({ example: 'ana.perez@example.com' })
  correo!: string;

  @ApiProperty({ example: '+57 300 123 4567' })
  telefono!: string;

  @ApiProperty({ description: 'ID of the linked Better Auth user' })
  idUsuario!: string;
}
