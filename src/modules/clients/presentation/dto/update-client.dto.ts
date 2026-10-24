import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateClientDto {
  @ApiPropertyOptional({
    example: '900123456-1',
    description: 'Unique tax identification number (NIT)',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nit?: string;

  @ApiPropertyOptional({
    example: 'Distribuidora Los Andes S.A.S.',
    description: 'Legal registered business name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  businessName?: string;

  @ApiPropertyOptional({
    example: 'Los Andes Market',
    description: 'Commercial trade name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  commercialName?: string;

  @ApiPropertyOptional({
    example: 'Calle 50 # 45-20',
    description: 'Physical street address',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    example: 'Antioquia',
    description: 'Department or state',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({
    example: 'Medellín',
    description: 'Municipality or city',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  municipality?: string;

  @ApiPropertyOptional({
    example: 'Laureles',
    description: 'Neighborhood',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  neighborhood?: string;

  @ApiPropertyOptional({
    example: '+573001234567',
    description: 'Contact phone number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    example: 'contacto@losandes.com',
    description: 'Contact email address',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Assigned zone ID',
  })
  @IsOptional()
  @IsInt()
  zoneId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Client type ID',
  })
  @IsOptional()
  @IsInt()
  clientTypeId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Potential classification ID',
  })
  @IsOptional()
  @IsInt()
  potentialId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Client status ID',
  })
  @IsOptional()
  @IsInt()
  clientStatusId?: number;

  @ApiPropertyOptional({
    example: 15,
    description: 'Visit frequency in days',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  visitFrequencyDays?: number;

  @ApiPropertyOptional({
    example: 6.2442,
    description:
      'Latitude coordinate (optional, autocalculated via geocoding if address/municipality changes and coords omitted)',
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @ApiPropertyOptional({
    example: -75.5812,
    description:
      'Longitude coordinate (optional, autocalculated via geocoding if address/municipality changes and coords omitted)',
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;
}
