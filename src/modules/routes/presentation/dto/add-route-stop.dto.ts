import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';

/**
 * Body to add a client as a stop of a route (HU-18).
 */
export class AddRouteStopDto {
  @ApiProperty({
    description: 'Id of the client to add to the route',
    example: 101,
  })
  @IsInt()
  @IsPositive()
  clientId!: number;

  @ApiPropertyOptional({
    description: 'Suggested arrival time at the client',
    example: '09:30:00',
  })
  @IsOptional()
  @IsString()
  suggestedTime?: string;

  @ApiPropertyOptional({
    description: 'Estimated minutes spent with the client',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  estimatedDurationMinutes?: number;
}
