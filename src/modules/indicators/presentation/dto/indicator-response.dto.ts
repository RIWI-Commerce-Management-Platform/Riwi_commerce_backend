import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WeeklyGoalProgress } from '../../application/get-weekly-goal.use-case.js';
import { WithEffectiveness } from '../../application/get-indicators.use-case.js';
import {
  AdvisorMetricsRow,
  CommercialMetrics,
  ZoneMetricsRow,
} from '../../domain/indicators.dao.js';

export class WeeklyGoalResponseDto {
  @ApiProperty()
  weekStart: Date;

  @ApiProperty()
  weekEnd: Date;

  @ApiProperty({ example: 20, description: 'Visits to complete this week' })
  goal: number;

  @ApiProperty({ enum: ['advisor', 'scheduled'] })
  goalSource: 'advisor' | 'scheduled';

  @ApiProperty({ example: 18 })
  scheduled: number;

  @ApiProperty({ example: 12 })
  completed: number;

  @ApiProperty({ example: 60, description: 'Progress bar value, 0 to 100' })
  percentage: number;

  constructor(progress: WeeklyGoalProgress) {
    Object.assign(this, progress);
  }
}

class CommercialMetricsDto {
  @ApiProperty({ example: 40 })
  scheduledVisits: number;

  @ApiProperty({ example: 31 })
  completedVisits: number;

  @ApiProperty({
    example: 77.5,
    description: 'Completed over scheduled visits, %',
  })
  effectiveness: number;

  @ApiProperty({ example: 12 })
  quotesCount: number;

  @ApiProperty({ example: 15400000 })
  quotedValue: number;

  @ApiProperty({ example: 5 })
  ordersCount: number;

  @ApiProperty({ example: 8200000, description: 'Excludes cancelled orders' })
  orderedValue: number;

  constructor(row: WithEffectiveness<CommercialMetrics>) {
    this.scheduledVisits = row.scheduledVisits;
    this.completedVisits = row.completedVisits;
    this.effectiveness = row.effectiveness;
    this.quotesCount = row.quotesCount;
    this.quotedValue = row.quotedValue;
    this.ordersCount = row.ordersCount;
    this.orderedValue = row.orderedValue;
  }
}

export class AdvisorIndicatorResponseDto extends CommercialMetricsDto {
  @ApiProperty({ example: 5 })
  advisorId: number;

  @ApiProperty({ example: 'Laura Martinez' })
  advisorName: string;

  @ApiPropertyOptional({ example: 1, nullable: true })
  zoneId: number | null;

  constructor(row: WithEffectiveness<AdvisorMetricsRow>) {
    super(row);
    this.advisorId = row.advisorId;
    this.advisorName = row.advisorName;
    this.zoneId = row.zoneId;
  }
}

export class ZoneIndicatorResponseDto extends CommercialMetricsDto {
  @ApiProperty({ example: 1 })
  zoneId: number;

  @ApiProperty({ example: 'Soledad' })
  zoneName: string;

  constructor(row: WithEffectiveness<ZoneMetricsRow>) {
    super(row);
    this.zoneId = row.zoneId;
    this.zoneName = row.zoneName;
  }
}
