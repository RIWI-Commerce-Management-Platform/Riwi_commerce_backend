import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({
    example: '900123456-1',
    description: 'Unique tax identification number (NIT)',
  })
  nit!: string;

  @ApiProperty({
    example: 'Distribuidora Los Andes S.A.S.',
    description: 'Legal registered business name',
  })
  businessName!: string;

  @ApiProperty({
    example: 'Los Andes Market',
    description: 'Commercial trade name',
  })
  commercialName!: string;

  @ApiProperty({
    example: 'Calle 50 # 45-20',
    description: 'Physical street address',
  })
  address!: string;

  @ApiProperty({
    example: 'Antioquia',
    description: 'Department or state',
  })
  department!: string;

  @ApiProperty({
    example: 'Medellín',
    description: 'Municipality or city',
  })
  municipality!: string;

  @ApiProperty({
    example: 'Laureles',
    description: 'Neighborhood',
  })
  neighborhood!: string;

  @ApiProperty({
    example: '+573001234567',
    description: 'Contact phone number',
  })
  phone!: string;

  @ApiProperty({
    example: 'contacto@losandes.com',
    description: 'Contact email address',
  })
  email!: string;

  @ApiProperty({
    example: 1,
    description: 'Assigned zone ID',
  })
  zoneId!: number;

  @ApiProperty({
    example: 1,
    description: 'Client type ID',
  })
  clientTypeId!: number;

  @ApiProperty({
    example: 1,
    description: 'Potential classification ID',
  })
  potentialId!: number;

  @ApiProperty({
    example: 1,
    description: 'Client status ID',
  })
  clientStatusId!: number;

  @ApiProperty({
    example: 15,
    description: 'Visit frequency in days',
  })
  visitFrequencyDays!: number;

  @ApiPropertyOptional({
    example: 6.2442,
    description:
      'Latitude coordinate (optional, autocalculated via geocoding if omitted)',
  })
  latitude?: number | null;

  @ApiPropertyOptional({
    example: -75.5812,
    description:
      'Longitude coordinate (optional, autocalculated via geocoding if omitted)',
  })
  longitude?: number | null;
}

