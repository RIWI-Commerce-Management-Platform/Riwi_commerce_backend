import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdvisorDto {
  @ApiProperty({ example: 'Ana Pérez' })
  nombre!: string;

  @ApiProperty({ example: 'ana.perez@example.com' })
  correo!: string;

  @ApiProperty({ example: '+57 300 123 4567' })
  telefono!: string;

  @ApiPropertyOptional({
    description:
      'Optional linked auth user ID. If omitted, the advisor can create an account later using this email.',
  })
  idUsuario?: string;
}
