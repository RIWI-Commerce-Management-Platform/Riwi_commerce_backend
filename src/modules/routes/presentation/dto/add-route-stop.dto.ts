import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';

/**
 * DTO para agregar un cliente como parada dentro de una ruta comercial (HU-18).
 */
export class AddRouteStopDto {
  @ApiProperty({
    description: 'ID del cliente a incorporar en la ruta',
    example: 101,
  })
  @IsInt()
  @IsPositive()
  clientId!: number;

  @ApiPropertyOptional({
    description: 'Hora estimada o sugerida de llegada al cliente',
    example: '09:30:00',
  })
  @IsOptional()
  @IsString()
  suggestedTime?: string;

  @ApiPropertyOptional({
    description: 'Duración estimada de la atención comercial en minutos',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  estimatedDurationMinutes?: number;
}
