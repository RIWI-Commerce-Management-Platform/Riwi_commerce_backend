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
    example: 'b6f6f96e-5264-4b53-9a3b-2fefbbbbbbbb',
    description: 'Assigned zone UUID',
  })
  zoneId!: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'Client type UUID',
  })
  clientTypeId!: string;

  @ApiProperty({
    example: 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f',
    description: 'Potential classification UUID',
  })
  potentialId!: string;

  @ApiProperty({
    example: 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a',
    description: 'Client status UUID',
  })
  clientStatusId!: string;

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

