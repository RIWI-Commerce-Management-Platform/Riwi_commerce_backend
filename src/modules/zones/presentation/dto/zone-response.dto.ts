import { ApiProperty } from '@nestjs/swagger';
import { Zone } from '../../domain/zone.entity.js';

export class ZoneResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(zone: Zone) {
    this.id = zone.id;
    this.name = zone.name;
    this.isActive = zone.isActive;
    this.createdAt = zone.createdAt;
    this.updatedAt = zone.updatedAt;
  }
}
