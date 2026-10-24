import { ApiProperty } from '@nestjs/swagger';
import { AdvisorOrmEntity } from '../../infrastructure/advisor.orm-entity.js';

export class AdvisorResponseDto {
  @ApiProperty({ example: 1 })
  id_asesor!: number;

  @ApiProperty({ example: 'Ana Pérez' })
  nombre!: string;

  @ApiProperty({ example: 'ana.perez@example.com' })
  correo!: string;

  @ApiProperty({ example: '+57 300 123 4567' })
  telefono!: string;

  @ApiProperty({ example: true })
  estado!: boolean;

  @ApiProperty({
    description: 'ID of the linked auth user, if the advisor has registered',
    nullable: true,
  })
  id_usuario!: string | null;

  constructor(advisor: AdvisorOrmEntity) {
    this.id_asesor = advisor.idAsesor;
    this.nombre = advisor.nombre;
    this.correo = advisor.correo;
    this.telefono = advisor.telefono;
    this.estado = advisor.estado;
    this.id_usuario = advisor.idUsuario;
  }
}
