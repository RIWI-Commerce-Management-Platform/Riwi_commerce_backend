import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

/**
 * Body to reorder the stops of a route (HU-18, HU-19).
 */
export class ReorderRouteStopsDto {
  @ApiProperty({
    description: 'Client ids in the new visit order',
    example: [103, 101, 102],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  orderedClientIds!: number[];
}
