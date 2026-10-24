import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Route } from '../../domain/route.entity.js';
import {
  EnrichedRouteDetails,
  EnrichedRouteStop,
} from '../../application/get-route-by-id.use-case.js';

export class ClientDetailsResponseDto {
  @ApiProperty({ example: 101 })
  id!: number;

  @ApiProperty({ example: 'Supermercado El Sol' })
  commercialName!: string;

  @ApiProperty({ example: 'Calle 72 # 54-10' })
  address!: string;

  @ApiProperty({ example: 'Barranquilla' })
  municipality!: string;

  @ApiProperty({ example: 1 })
  zoneId!: number;

  @ApiPropertyOptional({ example: 10.998, nullable: true })
  latitude!: number | null;

  @ApiPropertyOptional({ example: -74.805, nullable: true })
  longitude!: number | null;

  @ApiProperty({ example: true })
  isActive!: boolean;
}

export class RouteStopResponseDto {
  @ApiPropertyOptional({ example: 1 })
  id?: number;

  @ApiProperty({ example: 101 })
  clientId!: number;

  @ApiProperty({ example: 1 })
  visitOrder!: number;

  @ApiPropertyOptional({ example: '09:00:00', nullable: true })
  suggestedTime!: string | null;

  @ApiProperty({ example: 30 })
  estimatedDurationMinutes!: number;

  @ApiPropertyOptional({ type: () => ClientDetailsResponseDto, nullable: true })
  client?: ClientDetailsResponseDto | null;
}

export class RouteResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Barranquilla North weekly route' })
  name!: string;

  @ApiPropertyOptional({ example: 'Wholesale clients route', nullable: true })
  description!: string | null;

  @ApiProperty({ example: 1 })
  zoneId!: number;

  @ApiPropertyOptional({ example: 5, nullable: true })
  advisorId!: number | null;

  @ApiProperty({ example: 'MONDAY' })
  dayOfWeek!: string;

  @ApiProperty({ example: 'WEEKLY' })
  frequency!: string;

  @ApiPropertyOptional({ example: '08:00:00', nullable: true })
  startTime!: string | null;

  @ApiPropertyOptional({ example: '17:00:00', nullable: true })
  endTime!: string | null;

  @ApiProperty({ example: '2026-10-26' })
  startDate!: string;

  @ApiPropertyOptional({ example: '2026-12-31', nullable: true })
  endDate!: string | null;

  @ApiProperty({ example: 'DRAFT' })
  status!: string;

  @ApiPropertyOptional({ example: 14.5, nullable: true })
  totalDistanceKm!: number | null;

  @ApiPropertyOptional({ example: 120, nullable: true })
  estimatedDurationMinutes!: number | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 3 })
  stopsCount!: number;

  @ApiProperty({ type: [RouteStopResponseDto] })
  stops!: RouteStopResponseDto[];

  @ApiProperty({ example: '2026-10-23T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-10-23T12:00:00.000Z' })
  updatedAt!: string;

  static fromDomain(route: Route): RouteResponseDto {
    const dto = new RouteResponseDto();
    dto.id = route.id!;
    dto.name = route.name;
    dto.description = route.description;
    dto.zoneId = route.zoneId;
    dto.advisorId = route.advisorId;
    dto.dayOfWeek = route.dayOfWeek;
    dto.frequency = route.frequency;
    dto.startTime = route.startTime;
    dto.endTime = route.endTime;
    dto.startDate =
      route.startDate instanceof Date
        ? route.startDate.toISOString().split('T')[0]
        : String(route.startDate);
    dto.endDate = route.endDate
      ? route.endDate instanceof Date
        ? route.endDate.toISOString().split('T')[0]
        : String(route.endDate)
      : null;
    dto.status = route.status;
    dto.totalDistanceKm = route.totalDistanceKm;
    dto.estimatedDurationMinutes = route.estimatedDurationMinutes;
    dto.isActive = route.isActive;
    dto.stopsCount = route.stops.length;
    dto.stops = route.stops.map((stop) => ({
      id: stop.id,
      clientId: stop.clientId,
      visitOrder: stop.visitOrder,
      suggestedTime: stop.suggestedTime,
      estimatedDurationMinutes: stop.estimatedDurationMinutes,
    }));
    dto.createdAt = route.createdAt.toISOString();
    dto.updatedAt = route.updatedAt.toISOString();
    return dto;
  }

  static fromEnrichedDetails(details: EnrichedRouteDetails): RouteResponseDto {
    const dto = this.fromDomain(details.route);
    dto.stops = details.stops.map((stop: EnrichedRouteStop) => ({
      id: stop.id,
      clientId: stop.clientId,
      visitOrder: stop.visitOrder,
      suggestedTime: stop.suggestedTime,
      estimatedDurationMinutes: stop.estimatedDurationMinutes,
      client: stop.client
        ? {
            id: stop.client.id,
            commercialName: stop.client.commercialName,
            address: stop.client.address,
            municipality: stop.client.municipality,
            zoneId: stop.client.zoneId,
            latitude: stop.client.latitude,
            longitude: stop.client.longitude,
            isActive: stop.client.isActive,
          }
        : null,
    }));
    return dto;
  }
}

export class RouteMetricsResponseDto {
  @ApiProperty({ example: 18.5, description: 'Total distance in kilometers' })
  totalDistanceKm!: number;

  @ApiProperty({
    example: 145,
    description: 'Total estimated minutes (travel + visits)',
  })
  estimatedDurationMinutes!: number;
}
