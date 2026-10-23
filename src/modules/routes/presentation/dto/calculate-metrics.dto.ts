import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

/**
 * DTO para previsualizar el cálculo de distancia y duración de una secuencia de paradas (HU-22).
 */
export class CalculateMetricsDto {
  @ApiProperty({
    description: 'Secuencia ordenada de IDs de clientes a evaluar',
    example: [101, 102, 103],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  clientIds!: number[];

  @ApiPropertyOptional({
    description: 'Duración estimada promedio por parada en minutos',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  stopDurationMinutes?: number;
}
