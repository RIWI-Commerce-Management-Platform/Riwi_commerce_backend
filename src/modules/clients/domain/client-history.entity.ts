export interface ClientHistoryProps {
  id?: number;
  clientId: number;
  action: string;
  description: string;
  userId?: string | null;
  entityType?: string | null;
  entityId?: string | number | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
}

export class ClientHistory {
  readonly id?: number;
  readonly clientId: number;
  readonly action: string;
  readonly description: string;
  readonly userId: string | null;
  readonly entityType: string | null;
  readonly entityId: string | null;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: Date;

  constructor(props: ClientHistoryProps) {
    if (!props.clientId || props.clientId <= 0) {
      throw new Error('Client ID must be a positive integer.');
    }
    if (!props.action || props.action.trim().length === 0) {
      throw new Error('Action is required for client history.');
    }
    if (!props.description || props.description.trim().length === 0) {
      throw new Error('Description is required for client history.');
    }

    this.id = props.id;
    this.clientId = props.clientId;
    this.action = props.action.trim();
    this.description = props.description.trim();
    this.userId = props.userId ?? null;
    this.entityType = props.entityType ?? null;
    this.entityId = props.entityId !== undefined && props.entityId !== null ? String(props.entityId) : null;
    this.metadata = props.metadata ?? null;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: Omit<ClientHistoryProps, 'id' | 'createdAt'> & { createdAt?: Date }): ClientHistory {
    return new ClientHistory({
      ...props,
      createdAt: props.createdAt ?? new Date(),
    });
  }
}
