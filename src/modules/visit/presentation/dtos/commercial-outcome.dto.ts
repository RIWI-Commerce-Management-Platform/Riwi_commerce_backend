import { ApiProperty } from '@nestjs/swagger';

import { IsBoolean } from 'class-validator';

export class CommercialOutcomeDto {
  @ApiProperty({
    description:
      'The visit generated a quote. The frontend then opens the quote form with the client preloaded and sends `visitId`.',
    example: true,
  })
  @IsBoolean()
  quoteGenerated: boolean;

  @ApiProperty({ description: 'The visit generated an order.', example: false })
  @IsBoolean()
  orderGenerated: boolean;
}
