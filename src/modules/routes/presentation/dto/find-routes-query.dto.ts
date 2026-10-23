import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../shared/pagination/pagination-query.dto.js';
import { DayOfWeek } from '../../domain/day-of-week.enum.js';
import { RouteFrequency } from '../../domain/route-frequency.enum.js';
import { RouteStatus } from '../../domain/route-status.enum.js';

/**
 * Parámetros de consulta para filtrar el listado paginado de rutas comerciales (HU-21).
 */
export class FindRoutesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por zona geográfica',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  zoneId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por asesor comercial asignado',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  advisorId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por estado operativo de la ruta',
    enum: RouteStatus,
    example: RouteStatus.ASSIGNED,
  })
  @IsOptional()
  @IsEnum(RouteStatus)
  status?: RouteStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por día de la semana',
    enum: DayOfWeek,
    example: DayOfWeek.MONDAY,
  })
  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  @ApiPropertyOptional({
    description: 'Filtrar por frecuencia de repetición',
    enum: RouteFrequency,
    example: RouteFrequency.WEEKLY,
  })
  @IsOptional()
  @IsEnum(RouteFrequency)
  frequency?: RouteFrequency;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo o inactivo',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Búsqueda por texto en el nombre de la ruta',
    example: 'Norte',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
