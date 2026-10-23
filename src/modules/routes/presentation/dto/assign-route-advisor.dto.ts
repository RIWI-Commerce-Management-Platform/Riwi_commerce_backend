import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

/**
 * DTO para asignar una ruta a un asesor comercial y generar sus visitas programadas (HU-20).
 */
export class AssignRouteAdvisorDto {
  @ApiProperty({
    description: 'ID del asesor comercial asignado',
    example: 5,
  })
  @IsInt()
  @IsPositive()
  advisorId!: number;
}
