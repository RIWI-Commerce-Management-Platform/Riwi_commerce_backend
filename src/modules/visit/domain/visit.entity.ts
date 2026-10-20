export enum VisitStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  VISITED = 'VISITED',
  RESCHEDULE = 'RESCHEDULE',
  NOT_VISITED = 'NOT_VISITED',
}

export interface VisitResult {
  id: number;
  name: string;
  observation?: string;
}

export interface VisitProps {
  id: number;
  clientId: number;
  advisorId: number;
  routeId: number | null;
  scheduledAt: Date;
  actualDate: Date | null;
  startTime: string | null;
  endTime: string | null;
  status: VisitStatus;
  objective: string | null;
  clientName?: string;
  contactName?: string | null;
  clientPotential?: string | null;
  observations?: string | null;
  results?: VisitResult[];
}

export class Visit {
  constructor(private readonly props: VisitProps) {}

  get id(): number {
    return this.props.id;
  }

  get clientId(): number {
    return this.props.clientId;
  }

  get advisorId(): number {
    return this.props.advisorId;
  }

  get routeId(): number | null {
    return this.props.routeId;
  }

  get scheduleAt(): Date | null {
    return this.props.scheduledAt;
  }

  get actualDate(): Date | null {
    return this.props.actualDate;
  }

  get startTime(): string | null {
    return this.props.startTime;
  }

  get endTime(): string | null {
    return this.props.endTime;
  }

  get status(): VisitStatus {
    return this.props.status;
  }

  get objective(): string | null {
    return this.props.objective;
  }

  get clientName(): string | undefined {
    return this.props.clientName;
  }

  get contactName(): string | null | undefined {
    return this.props.contactName;
  }

  get clientPotential(): string | null | undefined {
    return this.props.clientPotential;
  }

  get results(): VisitResult[] {
    return this.props.results ?? [];
  }

  start(): Visit {
    if (this.props.status !== VisitStatus.PENDING) {
      throw new Error('Only pending visits can be started');
    }

    return new Visit({
      ...this.props,
      status: VisitStatus.IN_PROGRESS,
      actualDate: new Date(),
      startTime: new Date().toTimeString().slice(0, 8),
    });
  }

  registerResult(data: {
    endTime: string;
    observations: string;
    results: VisitResult[];
  }): Visit {
    if (this.props.status !== VisitStatus.IN_PROGRESS) {
      throw new Error('Only in-progress visits can be completed');
    }
    return new Visit({
      ...this.props,
      status: VisitStatus.VISITED,
      endTime: data.endTime,
      observations: data.observations,
      results: data.results,
    });
  }
  toJSON(): VisitProps {
    return { ...this.props };
  }
}
