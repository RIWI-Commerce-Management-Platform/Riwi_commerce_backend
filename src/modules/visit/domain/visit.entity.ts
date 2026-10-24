import { EmptyVisitResultsError } from './errors/empty-visit-results.error.js';
import { InvalidVisitObservationsError } from './errors/invalid-visit-observations.error.js';
import { InvalidVisitStatusError } from './errors/invalid-visit-status.error.js';
import { InvalidVisitRescheduleDateError } from './errors/invalid-visit-reschedule-date.error.js';

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
  /** "Commercial management" section of the visit form (HU-27). */
  quoteGenerated?: boolean;
  orderGenerated?: boolean;
}

/** Statuses a visit that hasn't happened yet can be in. */
const NOT_STARTED_STATUSES = [VisitStatus.PENDING, VisitStatus.RESCHEDULE];

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

  get quoteGenerated(): boolean {
    return this.props.quoteGenerated ?? false;
  }

  get orderGenerated(): boolean {
    return this.props.orderGenerated ?? false;
  }

  start(): Visit {
    if (!NOT_STARTED_STATUSES.includes(this.props.status)) {
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

  /**
   * Moves a visit that hasn't started to a new date (HU-26). The new date
   * can't be in the past.
   */
  reschedule(newDate: Date, reason?: string | null, now = new Date()): Visit {
    if (!NOT_STARTED_STATUSES.includes(this.props.status)) {
      throw new InvalidVisitStatusError(this.props.status, 'rescheduled');
    }
    if (Number.isNaN(newDate.getTime()) || newDate.getTime() < now.getTime()) {
      throw new InvalidVisitRescheduleDateError(newDate);
    }
    this.assertObservationsLength(reason);

    return new Visit({
      ...this.props,
      status: VisitStatus.RESCHEDULE,
      scheduledAt: newDate,
      observations: reason ?? this.props.observations ?? null,
    });
  }

  /** Records that the visit didn't happen (HU-26). */
  markNotVisited(reason?: string | null): Visit {
    if (
      !NOT_STARTED_STATUSES.includes(this.props.status) &&
      this.props.status !== VisitStatus.IN_PROGRESS
    ) {
      throw new InvalidVisitStatusError(
        this.props.status,
        'marked as not visited',
      );
    }
    this.assertObservationsLength(reason);

    return new Visit({
      ...this.props,
      status: VisitStatus.NOT_VISITED,
      observations: reason ?? this.props.observations ?? null,
    });
  }

  /**
   * Whether the visit generated a quote or an order (HU-27). Only a visit
   * that is in progress or done can generate them.
   */
  registerCommercialOutcome(outcome: {
    quoteGenerated: boolean;
    orderGenerated: boolean;
  }): Visit {
    if (
      this.props.status !== VisitStatus.IN_PROGRESS &&
      this.props.status !== VisitStatus.VISITED
    ) {
      throw new InvalidVisitStatusError(
        this.props.status,
        'given a commercial outcome',
      );
    }

    return new Visit({
      ...this.props,
      quoteGenerated: outcome.quoteGenerated,
      orderGenerated: outcome.orderGenerated,
    });
  }

  private assertObservationsLength(text?: string | null): void {
    if (text && text.length > MAX_VISIT_OBSERVATIONS_LENGTH) {
      throw new InvalidVisitObservationsError(
        text.length,
        MAX_VISIT_OBSERVATIONS_LENGTH,
      );
    }
  }

  toJSON(): VisitProps {
    return { ...this.props };
  }
}
