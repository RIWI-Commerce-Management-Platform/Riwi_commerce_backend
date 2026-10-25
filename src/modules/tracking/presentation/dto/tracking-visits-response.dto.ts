import { ApiProperty } from '@nestjs/swagger';
import { VisitStatus } from '../../../visit/domain/visit.entity.js';
import { PaginationMetaDto } from '../../../../shared/pagination/paginated-response.dto.js';
import type {
  TrackingVisitRow,
  TrackingVisitsPage,
} from '../../domain/tracking-visit.js';

class TrackingClientDto {
  @ApiProperty({ example: 4 })
  id: number;

  @ApiProperty({ example: 'Supertiendas Olímpica Prado' })
  commercialName: string;
}

class TrackingZoneDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Barranquilla Norte' })
  name: string;
}

class TrackingAdvisorDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({ example: 'Laura Martínez', nullable: true, type: String })
  name: string | null;
}

class TrackingRouteDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ruta Norte Lunes' })
  name: string;
}

export class TrackingVisitDto {
  @ApiProperty({ example: 12 })
  visitId: number;

  @ApiProperty({ example: '2026-10-19T13:00:00.000Z' })
  scheduledAt: Date;

  @ApiProperty({
    example: '2026-10-19',
    nullable: true,
    type: String,
    description: 'Real date of the visit; null while it has not happened',
  })
  actualDate: string | null;

  @ApiProperty({ enum: VisitStatus, example: VisitStatus.VISITED })
  status: string;

  @ApiProperty({
    example: true,
    description: 'The visit generated a quote (HU-27)',
  })
  quoteGenerated: boolean;

  @ApiProperty({
    example: false,
    description: 'The visit generated an order (HU-27)',
  })
  orderGenerated: boolean;

  @ApiProperty({ type: TrackingClientDto })
  client: TrackingClientDto;

  @ApiProperty({
    type: TrackingZoneDto,
    description: "The client's zone (territory)",
  })
  zone: TrackingZoneDto;

  @ApiProperty({ type: TrackingAdvisorDto })
  advisor: TrackingAdvisorDto;

  @ApiProperty({ type: TrackingRouteDto, nullable: true })
  route: TrackingRouteDto | null;

  constructor(row: TrackingVisitRow) {
    this.visitId = row.visitId;
    this.scheduledAt = row.scheduledAt;
    this.actualDate = row.actualDate;
    this.status = row.status;
    this.quoteGenerated = row.quoteGenerated;
    this.orderGenerated = row.orderGenerated;
    this.client = row.client;
    this.zone = row.zone;
    this.advisor = row.advisor;
    this.route = row.route;
  }
}

export class TrackingVisitsResponseDto {
  @ApiProperty({ example: '2026-10-19', description: 'Monday of the week' })
  weekStart: string;

  @ApiProperty({ example: '2026-10-25', description: 'Sunday of the week' })
  weekEnd: string;

  @ApiProperty({ type: [TrackingVisitDto] })
  data: TrackingVisitDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;

  constructor(page: TrackingVisitsPage) {
    this.weekStart = page.weekStart;
    this.weekEnd = page.weekEnd;
    this.data = page.data.map((row) => new TrackingVisitDto(row));
    this.meta = new PaginationMetaDto(page.meta);
  }
}
