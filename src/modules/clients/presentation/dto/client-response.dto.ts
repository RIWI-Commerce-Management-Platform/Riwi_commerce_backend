import { ApiProperty } from '@nestjs/swagger';
import { Client } from '../../domain/client.entity.js';

export class ClientResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '900123456-1' })
  nit: string;

  @ApiProperty({ example: 'Distribuidora Los Andes S.A.S.' })
  businessName: string;

  @ApiProperty({ example: 'Los Andes Market' })
  commercialName: string;

  @ApiProperty({ example: 'Calle 50 # 45-20' })
  address: string;

  @ApiProperty({ example: 'Antioquia' })
  department: string;

  @ApiProperty({ example: 'Medellín' })
  municipality: string;

  @ApiProperty({ example: 'Laureles' })
  neighborhood: string;

  @ApiProperty({ example: '+573001234567' })
  phone: string;

  @ApiProperty({ example: 'contacto@losandes.com' })
  email: string;

  @ApiProperty({ example: 1 })
  zoneId: number;

  @ApiProperty({ example: 1 })
  clientTypeId: number;

  @ApiProperty({ example: 1 })
  potentialId: number;

  @ApiProperty({ example: 1 })
  clientStatusId: number;

  @ApiProperty({ example: 15 })
  visitFrequencyDays: number;

  @ApiProperty({ example: 6.2442, nullable: true })
  latitude: number | null;

  @ApiProperty({ example: -75.5812, nullable: true })
  longitude: number | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-10-20T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-20T12:00:00.000Z' })
  updatedAt: Date;

  constructor(client: Client) {
    this.id = client.id!;
    this.nit = client.nit;
    this.businessName = client.businessName;
    this.commercialName = client.commercialName;
    this.address = client.address;
    this.department = client.department;
    this.municipality = client.municipality;
    this.neighborhood = client.neighborhood;
    this.phone = client.phone;
    this.email = client.email;
    this.zoneId = client.zoneId;
    this.clientTypeId = client.clientTypeId;
    this.potentialId = client.potentialId;
    this.clientStatusId = client.clientStatusId;
    this.visitFrequencyDays = client.visitFrequencyDays;
    this.latitude = client.latitude;
    this.longitude = client.longitude;
    this.isActive = client.isActive;
    this.createdAt = client.createdAt;
    this.updatedAt = client.updatedAt;
  }
}
