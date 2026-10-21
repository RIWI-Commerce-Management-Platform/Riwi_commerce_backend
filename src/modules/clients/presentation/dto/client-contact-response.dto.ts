import { ApiProperty } from '@nestjs/swagger';
import { ClientContact } from '../../domain/client-contact.entity.js';

export class ClientContactResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  clientId: number;

  @ApiProperty({ example: 'Carlos Mario Mendoza' })
  name: string;

  @ApiProperty({ example: 'Gerente de Compras' })
  position: string;

  @ApiProperty({ example: '+576053001122' })
  phone: string;

  @ApiProperty({ example: '+573009876543' })
  mobile: string;

  @ApiProperty({ example: 'carlos.mendoza@empresa.com' })
  email: string;

  @ApiProperty({ example: true })
  isPrimary: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-10-21T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-21T12:00:00.000Z' })
  updatedAt: Date;

  constructor(contact: ClientContact) {
    this.id = contact.id!;
    this.clientId = contact.clientId;
    this.name = contact.name;
    this.position = contact.position;
    this.phone = contact.phone;
    this.mobile = contact.mobile;
    this.email = contact.email;
    this.isPrimary = contact.isPrimary;
    this.isActive = contact.isActive;
    this.createdAt = contact.createdAt;
    this.updatedAt = contact.updatedAt;
  }
}
