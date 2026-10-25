import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClientHistoryEntry } from '../../domain/client-history.dao.js';

export class ClientHistoryEntryResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  clientId: number;

  @ApiProperty({ example: 3, description: 'User who performed the action' })
  userId: number;

  @ApiPropertyOptional({ example: 'Ana Gomez', nullable: true })
  userName: string | null;

  @ApiProperty({ example: 'visit.result_registered' })
  action: string;

  @ApiProperty({ example: 'visit' })
  entityType: string;

  @ApiProperty({ example: '12' })
  entityId: string;

  @ApiPropertyOptional({ example: 'Client data updated', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  metadata: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-10-21T12:00:00.000Z' })
  createdAt: Date;

  constructor(entry: ClientHistoryEntry) {
    this.id = entry.id;
    this.clientId = entry.clientId;
    this.userId = entry.userId;
    this.userName = entry.userName;
    this.action = entry.action;
    this.entityType = entry.entityType;
    this.entityId = entry.entityId;
    this.description = entry.description;
    this.metadata = entry.metadata;
    this.createdAt = entry.createdAt;
  }
}
