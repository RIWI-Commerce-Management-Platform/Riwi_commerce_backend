import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';
import { parseBooleanQuery } from '../../../../shared/pagination/parse-boolean-query.js';

const DATE_MESSAGE = "must use the 'YYYY-MM-DD' format";

/**
 * The filters active in the frontend lists. Visits filter their scheduled
 * date and quotes/orders their creation date; clients ignore the dates.
 */
export class ReportQueryDto {
  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'From this day (inclusive)',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: `startDate ${DATE_MESSAGE}` })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-10-31',
    description: 'Up to this day (inclusive)',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: `endDate ${DATE_MESSAGE}` })
  endDate?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Client's zone. Forced for regional directors.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  zoneId?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Advisor (user id). Visits, quotes and orders.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  advisorId?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Visits, quotes and orders.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  clientId?: number;

  @ApiPropertyOptional({
    example: 'VISITED',
    description: 'Status of the visit, quote or order.',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    example: 'andes',
    description: 'Clients: NIT or name.',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, description: 'Clients only.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  clientTypeId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Clients only.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  potentialId?: number;

  @ApiPropertyOptional({ example: 'Soledad', description: 'Clients only.' })
  @IsOptional()
  @IsString()
  municipality?: string;

  @ApiPropertyOptional({ example: true, description: 'Clients only.' })
  @IsOptional()
  @Transform(({ value }) => parseBooleanQuery(value))
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    enum: ['comma', 'semicolon'],
    default: 'comma',
    description:
      'Column separator. Use `semicolon` for Excel with a Spanish (Colombia) regional configuration.',
  })
  @IsOptional()
  @IsIn(['comma', 'semicolon'])
  separator?: 'comma' | 'semicolon';
}
