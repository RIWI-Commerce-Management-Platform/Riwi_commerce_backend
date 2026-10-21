import { EmptyVisitResultsError } from './errors/empty-visit-results.error.js';
import { InvalidVisitObservationsError } from './errors/invalid-visit-observations.error.js';
import { InvalidVisitStatusError } from './errors/invalid-visit-status.error.js';

export enum VisitStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  VISITED = 'VISITED',
  RESCHEDULE = 'RESCHEDULE',
  NOT_VISITED = 'NOT_VISITED',
}

export const MAX_VISIT_OBSERVATIONS_LENGTH = 500;

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

  get scheduledAt(): Date {
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

  get observations(): string | null | undefined {
    return this.props.observations;
  }

  get results(): VisitResult[] {
    return this.props.results ?? [];
  }

  start(): Visit {
    if (this.props.status !== VisitStatus.PENDING) {
      throw new InvalidVisitStatusError(this.props.status, 'started');
    }

    const now = new Date();

    return new Visit({
      ...this.props,
      status: VisitStatus.IN_PROGRESS,
      actualDate: now,
      startTime: now.toTimeString().slice(0, 8),
    });
  }

  registerResult(data: {
    endTime: string;
    observations: string;
    results: VisitResult[];
  }): Visit {
    if (this.props.status !== VisitStatus.IN_PROGRESS) {
      throw new InvalidVisitStatusError(this.props.status, 'completed');
    }

    if (data.results.length === 0) {
      throw new EmptyVisitResultsError();
    }

    if (data.observations.length > MAX_VISIT_OBSERVATIONS_LENGTH) {
      throw new InvalidVisitObservationsError(
        data.observations.length,
        MAX_VISIT_OBSERVATIONS_LENGTH,
      );
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
