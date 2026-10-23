import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { DayOfWeek } from '../../domain/day-of-week.enum.js';
import { RouteFrequency } from '../../domain/route-frequency.enum.js';

/**
 * DTO para la actualización de los datos generales de una ruta comercial (HU-17 y HU-21).
 */
export class UpdateRouteDraftDto {
  @ApiPropertyOptional({
    description: 'Nombre descriptivo de la ruta comercial',
    example: 'Ruta Semanal Barranquilla Norte - Ajustada',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    description: 'Descripción u objetivo comercial del recorrido',
    example: 'Ampliación de clientes minoristas en el sector norte',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'ID de la zona territorial a la que pertenece la ruta',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  zoneId?: number;

  @ApiPropertyOptional({
    description: 'Día de la semana fijado para recorrer la ruta',
    enum: DayOfWeek,
    example: DayOfWeek.TUESDAY,
  })
  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  @ApiPropertyOptional({
    description: 'Frecuencia de repetición de la ruta',
    enum: RouteFrequency,
    example: RouteFrequency.BIWEEKLY,
  })
  @IsOptional()
  @IsEnum(RouteFrequency)
  frequency?: RouteFrequency;

  @ApiPropertyOptional({
    description: 'Hora sugerida de inicio de la jornada',
    example: '08:30:00',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Hora sugerida de finalización de la jornada',
    example: '17:30:00',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Fecha de inicio de vigencia de la ruta (YYYY-MM-DD)',
    example: '2026-10-26',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin de vigencia de la ruta (YYYY-MM-DD)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
