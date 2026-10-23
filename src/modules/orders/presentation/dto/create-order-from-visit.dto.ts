import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateOrderFromVisitDto {
  @ApiProperty({ description: 'Approved quote belonging to the visit client' })
  @IsInt()
  @Min(1)
  quoteId: number;
}
