import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientHistoryDto {
  @ApiProperty({
    example: 'note.added',
    description:
      'Identifier for the action or interaction performed on the client',
  })
  action!: string;

  @ApiProperty({
    example: 'Client requested an updated catalog for the next delivery cycle.',
    description: 'Detailed description or notes about the interaction',
  })
  description!: string;

  @ApiPropertyOptional({
    example: { callDurationSeconds: 180, canal: 'phone' },
    description: 'Arbitrary structured metadata associated with the event',
  })
  metadata?: Record<string, unknown>;
}
