import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { FollowUp } from '../../domain/follow-up.entity.js';

export class FollowUpResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  visitId: number;

  @ApiProperty({ format: 'date' })
  nextDate: Date;

  @ApiProperty()
  activity: string;

  @ApiPropertyOptional({ nullable: true })
  observation: string | null;

  @ApiProperty()
  responsibleAdvisorId: number;

  @ApiProperty()
  completed: boolean;

  constructor(followUp: FollowUp) {
    this.id = followUp.id;
    this.visitId = followUp.visitId;
    this.nextDate = followUp.nextDate;
    this.activity = followUp.activity;
    this.observation = followUp.observation ?? null;
    this.responsibleAdvisorId = followUp.responsibleAdvisorId;
    this.completed = followUp.completed;
  }
}
