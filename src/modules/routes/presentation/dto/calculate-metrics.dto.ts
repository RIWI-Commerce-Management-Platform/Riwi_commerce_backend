import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

/**
 * Body to preview the distance and duration of a sequence of stops (HU-22).
 */
export class CalculateMetricsDto {
  @ApiProperty({
    description: 'Ordered client ids to evaluate',
    example: [101, 102, 103],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  clientIds!: number[];

  @ApiPropertyOptional({
    description: 'Average estimated minutes per stop',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  stopDurationMinutes?: number;
}
