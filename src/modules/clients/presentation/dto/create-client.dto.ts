import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateClientDto {
  @ApiProperty({
    example: '900123456-1',
    description: 'Unique tax identification number (NIT)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nit!: string;

  @ApiProperty({
    example: 'Distribuidora Los Andes S.A.S.',
    description: 'Legal registered business name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  businessName!: string;

  @ApiProperty({
    example: 'Los Andes Market',
    description: 'Commercial trade name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  commercialName!: string;

  @ApiProperty({
    example: 'Calle 50 # 45-20',
    description: 'Physical street address',
  })
  @IsString()
  @MaxLength(255)
  address!: string;

  @ApiProperty({
    example: 'Antioquia',
    description: 'Department or state',
  })
  @IsString()
  @MaxLength(100)
  department!: string;

  @ApiProperty({
    example: 'Medellín',
    description: 'Municipality or city',
  })
  @IsString()
  @MaxLength(100)
  municipality!: string;

  @ApiProperty({
    example: 'Laureles',
    description: 'Neighborhood',
  })
  @IsString()
  @MaxLength(100)
  neighborhood!: string;

  @ApiProperty({
    example: '+573001234567',
    description: 'Contact phone number',
  })
  @IsString()
  @MaxLength(30)
  phone!: string;

  @ApiProperty({
    example: 'contacto@losandes.com',
    description: 'Contact email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 1,
    description: 'Assigned zone ID',
  })
  @IsInt()
  zoneId!: number;

  @ApiProperty({
    example: 1,
    description: 'Client type ID',
  })
  @IsInt()
  clientTypeId!: number;

  @ApiProperty({
    example: 1,
    description: 'Potential classification ID',
  })
  @IsInt()
  potentialId!: number;

  @ApiProperty({
    example: 1,
    description: 'Client status ID',
  })
  @IsInt()
  clientStatusId!: number;

  @ApiProperty({
    example: 15,
    description: 'Visit frequency in days',
  })
  @IsInt()
  @Min(1)
  visitFrequencyDays!: number;

  @ApiPropertyOptional({
    example: 6.2442,
    description:
      'Latitude coordinate (optional, autocalculated via geocoding if omitted)',
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @ApiPropertyOptional({
    example: -75.5812,
    description:
      'Longitude coordinate (optional, autocalculated via geocoding if omitted)',
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;
}
