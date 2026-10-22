import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { QuoteStatus } from '../../domain/quote-status.enum.js';

export class ChangeQuoteStatusDto {
  @ApiProperty({
    description: 'New status for the quote',
    enum: QuoteStatus,
    example: QuoteStatus.SENT,
  })
  @IsNotEmpty()
  @IsEnum(QuoteStatus)
  status!: QuoteStatus;
}
