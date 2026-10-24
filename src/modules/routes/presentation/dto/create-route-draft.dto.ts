import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { DayOfWeek } from '../../domain/day-of-week.enum.js';
import { RouteFrequency } from '../../domain/route-frequency.enum.js';

/**
 * DTO para la creación del borrador de una ruta comercial (Paso 1 del Wizard - HU-17).
 */
export class CreateRouteDraftDto {
  @ApiProperty({
    description: 'Nombre descriptivo de la ruta comercial',
    example: 'Ruta Semanal Barranquilla Norte',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    description: 'Descripción u objetivo comercial del recorrido',
    example: 'Cobertura de clientes mayoristas en el sector norte',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'ID de la zona territorial a la que pertenece la ruta',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  zoneId!: number;

  @ApiProperty({
    description: 'Día de la semana fijado para recorrer la ruta',
    enum: DayOfWeek,
    example: DayOfWeek.MONDAY,
  })
  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @ApiProperty({
    description: 'Frecuencia de repetición de la ruta',
    enum: RouteFrequency,
    example: RouteFrequency.WEEKLY,
  })
  @IsEnum(RouteFrequency)
  frequency!: RouteFrequency;

  @ApiPropertyOptional({
    description: 'Hora sugerida de inicio de la jornada',
    example: '08:00:00',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Hora sugerida de finalización de la jornada',
    example: '17:00:00',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({
    description: 'Fecha de inicio de vigencia de la ruta (YYYY-MM-DD)',
    example: '2026-10-26',
  })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin de vigencia de la ruta (opcional, YYYY-MM-DD)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
