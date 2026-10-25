import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Visit } from '../../domain/visit.entity.js';

export class VisitSummaryResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  clientId: number;

  @ApiPropertyOptional({ nullable: true })
  routeId: number | null;

  @ApiProperty()
  scheduledAt: Date;

  @ApiProperty({
    enum: ['PENDING', 'IN_PROGRESS', 'VISITED', 'RESCHEDULE', 'NOT_VISITED'],
  })
  status: string;

  @ApiPropertyOptional({ nullable: true })
  objective: string | null;

  constructor(visit: Visit) {
    this.id = visit.id;
    this.clientId = visit.clientId;
    this.routeId = visit.routeId;
    this.scheduledAt = visit.scheduledAt;
    this.status = visit.status;
    this.objective = visit.objective;
  }
}
