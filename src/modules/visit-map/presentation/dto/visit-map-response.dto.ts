import { ApiProperty } from '@nestjs/swagger';
import { VisitStatus } from '../../../visit/domain/visit.entity.js';
import {
  MapStatus,
  type VisitMap,
  type VisitMapMarker,
} from '../../domain/visit-map.js';

class MapLocationDto {
  @ApiProperty({ example: 10.9878, description: 'WGS84 decimal degrees' })
  latitude: number;

  @ApiProperty({ example: -74.7889, description: 'WGS84 decimal degrees' })
  longitude: number;
}

class MapClientDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Autoservicio El Prado' })
  commercialName: string;

  @ApiProperty({ example: 'Cra 54 # 64-120' })
  address: string;

  @ApiProperty({ example: 'Barranquilla' })
  municipality: string;
}

class MapZoneDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Barranquilla Norte' })
  name: string;
}

class MapAdvisorDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({ example: 'Laura Martinez', nullable: true, type: String })
  name: string | null;
}

class MapRouteDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'North weekly route' })
  name: string;
}

export class VisitMapMarkerDto {
  @ApiProperty({ example: 1 })
  visitId: number;

  @ApiProperty({ example: '2026-10-19T13:00:00.000Z' })
  scheduledAt: Date;

  @ApiProperty({ enum: VisitStatus, description: 'Stored visit status' })
  status: string;

  @ApiProperty({
    enum: MapStatus,
    description:
      'Legend category: ORDER_CLOSED if the visit generated an order (HU-27), otherwise from the status (IN_PROGRESS shows as PENDING)',
  })
  mapStatus: MapStatus;

  @ApiProperty({ example: true })
  orderGenerated: boolean;

  @ApiProperty({
    type: MapLocationDto,
    nullable: true,
    description:
      'Client coordinates; null when they are missing or out of range (no marker)',
  })
  location: MapLocationDto | null;

  @ApiProperty({ type: MapClientDto })
  client: MapClientDto;

  @ApiProperty({ type: MapZoneDto, description: "The client's zone" })
  zone: MapZoneDto;

  @ApiProperty({ type: MapAdvisorDto })
  advisor: MapAdvisorDto;

  @ApiProperty({ type: MapRouteDto, nullable: true })
  route: MapRouteDto | null;

  constructor(marker: VisitMapMarker) {
    this.visitId = marker.visitId;
    this.scheduledAt = marker.scheduledAt;
    this.status = marker.status;
    this.mapStatus = marker.mapStatus;
    this.orderGenerated = marker.orderGenerated;
    this.location = marker.location;
    this.client = marker.client;
    this.zone = marker.zone;
    this.advisor = marker.advisor;
    this.route = marker.route;
  }
}

class MapCountsDto {
  @ApiProperty({ example: 2 })
  VISITED: number;

  @ApiProperty({ example: 3 })
  PENDING: number;

  @ApiProperty({ example: 0 })
  NOT_VISITED: number;

  @ApiProperty({ example: 1 })
  ORDER_CLOSED: number;

  @ApiProperty({ example: 0 })
  RESCHEDULED: number;
}

export class VisitMapResponseDto {
  @ApiProperty({ example: '2026-10-19', description: 'Day actually used' })
  date: string;

  @ApiProperty({ example: 6, description: 'Visits of the day' })
  total: number;

  @ApiProperty({
    example: 0,
    description: 'Visits whose client has no valid coordinates',
  })
  withoutLocation: number;

  @ApiProperty({
    type: MapCountsDto,
    description: 'Visits per legend category',
  })
  counts: Record<MapStatus, number>;

  @ApiProperty({ type: [VisitMapMarkerDto] })
  data: VisitMapMarkerDto[];

  constructor(map: VisitMap) {
    this.date = map.date;
    this.total = map.total;
    this.withoutLocation = map.withoutLocation;
    this.counts = map.counts;
    this.data = map.data.map((marker) => new VisitMapMarkerDto(marker));
  }
}
