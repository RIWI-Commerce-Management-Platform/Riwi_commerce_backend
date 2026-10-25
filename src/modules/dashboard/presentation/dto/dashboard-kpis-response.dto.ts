import { ApiProperty } from '@nestjs/swagger';
import type { DashboardKpis } from '../../domain/dashboard-kpis.js';

export class DashboardKpisResponseDto {
  @ApiProperty({ example: '2026-10-19', description: 'Monday of the week' })
  weekStart: string;

  @ApiProperty({ example: '2026-10-25', description: 'Sunday of the week' })
  weekEnd: string;

  @ApiProperty({
    example: 1,
    nullable: true,
    type: Number,
    description: 'null means every territory',
  })
  territoryId: number | null;

  @ApiProperty({ example: 18, description: 'Visits scheduled in the week' })
  scheduledVisits: number;

  @ApiProperty({ example: 6, description: "Of those, in 'VISITED' status" })
  completedVisits: number;

  @ApiProperty({
    example: 33.3,
    nullable: true,
    type: Number,
    description:
      'Completed over scheduled visits, %, one decimal (provisional). null without scheduled visits.',
  })
  effectiveness: number | null;

  @ApiProperty({
    example: '2204000.00',
    description:
      'Total of the quotes created in the week (COP), exact decimal as text',
  })
  quotedAmount: string;

  @ApiProperty({
    example: 1,
    description:
      'Provisional rule: orders created in the week that are not cancelled',
  })
  closedOrders: number;

  @ApiProperty({
    example: null,
    nullable: true,
    type: String,
    description:
      'Invoiced revenue. Always null: the platform has no invoicing data source yet',
  })
  revenue: string | null;

  constructor(kpis: DashboardKpis) {
    this.weekStart = kpis.weekStart;
    this.weekEnd = kpis.weekEnd;
    this.territoryId = kpis.territoryId;
    this.scheduledVisits = kpis.scheduledVisits;
    this.completedVisits = kpis.completedVisits;
    this.effectiveness = kpis.effectiveness;
    this.quotedAmount = kpis.quotedAmount;
    this.closedOrders = kpis.closedOrders;
    this.revenue = kpis.revenue;
  }
}
