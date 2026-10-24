import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

/**
 * DTO para reordenar la secuencia de paradas de una ruta (HU-18 y HU-19).
 */
export class ReorderRouteStopsDto {
  @ApiProperty({
    description:
      'Lista ordenada de IDs de clientes según el nuevo recorrido deseado',
    example: [103, 101, 102],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  orderedClientIds!: number[];
}
