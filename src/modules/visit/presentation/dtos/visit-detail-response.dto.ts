import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Visit, VisitResult } from '../../domain/visit.entity.js';

import { VisitSummaryResponseDto } from './visit-summary-response.dto.js';

export class VisitResultResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  observation?: string;

  constructor(result: VisitResult) {
    this.id = result.id;
    this.name = result.name;
    this.observation = result.observation;
  }
}

export class VisitDetailResponseDto extends VisitSummaryResponseDto {
  @ApiPropertyOptional({ nullable: true })
  actualDate: Date | null;

  @ApiPropertyOptional({ nullable: true })
  startTime: string | null;

  @ApiPropertyOptional({ nullable: true })
  endTime: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 500 })
  observations: string | null;

  @ApiPropertyOptional()
  clientName?: string;

  @ApiPropertyOptional({ nullable: true })
  contactName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  clientPotential?: string | null;

  @ApiProperty({ type: [VisitResultResponseDto] })
  results: VisitResultResponseDto[];

  @ApiProperty({ description: 'The visit generated a quote (HU-27)' })
  quoteGenerated: boolean;

  @ApiProperty({ description: 'The visit generated an order (HU-27)' })
  orderGenerated: boolean;

  constructor(visit: Visit) {
    super(visit);
    this.actualDate = visit.actualDate;
    this.startTime = visit.startTime;
    this.endTime = visit.endTime;
    this.observations = visit.observations ?? null;
    this.clientName = visit.clientName;
    this.contactName = visit.contactName;
    this.clientPotential = visit.clientPotential;
    this.results = visit.results.map(
      (result) => new VisitResultResponseDto(result),
    );
    this.quoteGenerated = visit.quoteGenerated;
    this.orderGenerated = visit.orderGenerated;
  }
}
