import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClientDto {
  @ApiPropertyOptional({
    example: '900123456-1',
    description: 'Unique tax identification number (NIT)',
  })
  nit?: string;

  @ApiPropertyOptional({
    example: 'Distribuidora Los Andes S.A.S.',
    description: 'Legal registered business name',
  })
  businessName?: string;

  @ApiPropertyOptional({
    example: 'Los Andes Market',
    description: 'Commercial trade name',
  })
  commercialName?: string;

  @ApiPropertyOptional({
    example: 'Calle 50 # 45-20',
    description: 'Physical street address',
  })
  address?: string;

  @ApiPropertyOptional({
    example: 'Antioquia',
    description: 'Department or state',
  })
  department?: string;

  @ApiPropertyOptional({
    example: 'Medellín',
    description: 'Municipality or city',
  })
  municipality?: string;

  @ApiPropertyOptional({
    example: 'Laureles',
    description: 'Neighborhood',
  })
  neighborhood?: string;

  @ApiPropertyOptional({
    example: '+573001234567',
    description: 'Contact phone number',
  })
  phone?: string;

  @ApiPropertyOptional({
    example: 'contacto@losandes.com',
    description: 'Contact email address',
  })
  email?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Assigned zone ID',
  })
  zoneId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Client type ID',
  })
  clientTypeId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Potential classification ID',
  })
  potentialId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Client status ID',
  })
  clientStatusId?: number;

  @ApiPropertyOptional({
    example: 15,
    description: 'Visit frequency in days',
  })
  visitFrequencyDays?: number;

  @ApiPropertyOptional({
    example: 6.2442,
    description:
      'Latitude coordinate (optional, autocalculated via geocoding if address/municipality changes and coords omitted)',
  })
  latitude?: number | null;

  @ApiPropertyOptional({
    example: -75.5812,
    description:
      'Longitude coordinate (optional, autocalculated via geocoding if address/municipality changes and coords omitted)',
  })
  longitude?: number | null;
}

