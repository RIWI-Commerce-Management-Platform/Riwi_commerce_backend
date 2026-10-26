import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Visit } from '../../domain/visit.entity.js';

export class VisitSummaryResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  clientId: number;

  @ApiPropertyOptional({ nullable: true })
  advisorId?: number;

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

  @ApiPropertyOptional({ nullable: true })
  startTime?: string | null;

  @ApiPropertyOptional({ nullable: true })
  endTime?: string | null;

  @ApiPropertyOptional({ nullable: true })
  observations?: string | null;

  constructor(visit: Visit) {
    this.id = visit.id;
    this.clientId = visit.clientId;
    this.advisorId = visit.advisorId;
    this.routeId = visit.routeId;
    this.scheduledAt = visit.scheduledAt;
    this.status = visit.status;
    this.objective = visit.objective;
    this.startTime = visit.startTime;
    this.endTime = visit.endTime;
    this.observations = visit.observations;
  }
}
