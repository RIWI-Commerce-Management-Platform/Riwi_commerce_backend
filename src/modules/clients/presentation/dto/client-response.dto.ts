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

  @ApiProperty({ example: 'b6f6f96e-5264-4b53-9a3b-2fefbbbbbbbb' })
  zoneId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  clientTypeId: string;

  @ApiProperty({ example: 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f' })
  potentialId: string;

  @ApiProperty({ example: 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a' })
  clientStatusId: string;

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

