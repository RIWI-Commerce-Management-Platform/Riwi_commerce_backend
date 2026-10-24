import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { FollowUp, FollowUpStatus } from '../../domain/follow-up.entity.js';

export class FollowUpResponseDto {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional({ nullable: true })
  visitId: number | null;

  @ApiProperty()
  clientId: number;

  @ApiPropertyOptional()
  clientName?: string;

  @ApiProperty({ description: 'User responsible for the follow-up' })
  responsibleId: number;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty()
  activity: string;

  @ApiPropertyOptional({ nullable: true })
  observation: string | null;

  @ApiProperty({ enum: FollowUpStatus })
  status: FollowUpStatus;

  @ApiPropertyOptional({ nullable: true })
  completedAt: Date | null;

  constructor(followUp: FollowUp) {
    this.id = followUp.id!;
    this.visitId = followUp.visitId;
    this.clientId = followUp.clientId;
    this.clientName = followUp.clientName;
    this.responsibleId = followUp.responsibleId;
    this.dueDate = followUp.dueDate;
    this.activity = followUp.activity;
    this.observation = followUp.observation;
    this.status = followUp.status;
    this.completedAt = followUp.completedAt;
  }
}
