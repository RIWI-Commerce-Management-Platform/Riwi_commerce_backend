import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClientHistory } from '../../domain/client-history.entity.js';

export class ClientHistoryResponseDto {
  @ApiProperty({ example: 1, description: 'Unique identifier of the history record' })
  id: number;

  @ApiProperty({ example: 10, description: 'ID of the associated client' })
  clientId: number;

  @ApiPropertyOptional({
    example: 'usr_abc123',
    description: 'Identifier of the user or advisor who performed the action',
    nullable: true,
  })
  userId: string | null;

  @ApiProperty({
    example: 'visit.started',
    description: 'Action key representing the operation or interaction',
  })
  action: string;

  @ApiProperty({
    example: 'Visit #5 started by advisor',
    description: 'Human-readable description of what took place',
  })
  description: string;

  @ApiPropertyOptional({
    example: 'visit',
    description: 'Entity type that originated this interaction',
    nullable: true,
  })
  entityType: string | null;

  @ApiPropertyOptional({
    example: '5',
    description: 'Identifier of the related entity',
    nullable: true,
  })
  entityId: string | null;

  @ApiPropertyOptional({
    example: { resultIds: [1] },
    description: 'Structured metadata or context details',
    nullable: true,
  })
  metadata: Record<string, unknown> | null;

  @ApiProperty({
    example: '2026-10-22T09:00:00.000Z',
    description: 'Timestamp when the action was registered',
  })
  createdAt: Date;

  constructor(history: ClientHistory) {
    this.id = history.id!;
    this.clientId = history.clientId;
    this.userId = history.userId;
    this.action = history.action;
    this.description = history.description;
    this.entityType = history.entityType;
    this.entityId = history.entityId;
    this.metadata = history.metadata;
    this.createdAt = history.createdAt;
  }

  static fromDomain(history: ClientHistory): ClientHistoryResponseDto {
    return new ClientHistoryResponseDto(history);
  }
}
