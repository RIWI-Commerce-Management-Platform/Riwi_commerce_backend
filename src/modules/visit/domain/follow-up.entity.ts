import { InvalidFollowUpError } from './errors/invalid-follow-up.error.js';

export enum FollowUpStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export const MAX_FOLLOW_UP_ACTIVITY_LENGTH = 150;
export const MAX_FOLLOW_UP_OBSERVATION_LENGTH = 500;

export interface FollowUpProps {
  id?: number;
  visitId: number | null;
  clientId: number;
  /** User responsible for the follow-up; it shows up in their agenda. */
  responsibleId: number;
  createdById: number;
  dueDate: Date;
  activity: string;
  observation: string | null;
  status: FollowUpStatus;
  completedAt: Date | null;
  createdAt?: Date;
  clientName?: string;
}

/** SEGUIMIENTO: next action agreed with a client after a visit (HU-25). */
export class FollowUp {
  constructor(private readonly props: FollowUpProps) {
    const activity = props.activity?.trim() ?? '';
    if (!activity) {
      throw new InvalidFollowUpError('The follow-up activity is required.');
    }
    if (activity.length > MAX_FOLLOW_UP_ACTIVITY_LENGTH) {
      throw new InvalidFollowUpError(
        `The follow-up activity must not exceed ${MAX_FOLLOW_UP_ACTIVITY_LENGTH} characters.`,
      );
    }
    if (
      props.observation &&
      props.observation.length > MAX_FOLLOW_UP_OBSERVATION_LENGTH
    ) {
      throw new InvalidFollowUpError(
        `The follow-up observation must not exceed ${MAX_FOLLOW_UP_OBSERVATION_LENGTH} characters.`,
      );
    }
    if (Number.isNaN(props.dueDate.getTime())) {
      throw new InvalidFollowUpError('The follow-up date is not valid.');
    }
    this.props = { ...props, activity };
  }

  static schedule(
    props: Omit<FollowUpProps, 'status' | 'completedAt'>,
  ): FollowUp {
    return new FollowUp({
      ...props,
      status: FollowUpStatus.PENDING,
      completedAt: null,
    });
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get visitId(): number | null {
    return this.props.visitId;
  }

  get clientId(): number {
    return this.props.clientId;
  }

  get responsibleId(): number {
    return this.props.responsibleId;
  }

  get createdById(): number {
    return this.props.createdById;
  }

  get dueDate(): Date {
    return this.props.dueDate;
  }

  get activity(): string {
    return this.props.activity;
  }

  get observation(): string | null {
    return this.props.observation;
  }

  get status(): FollowUpStatus {
    return this.props.status;
  }

  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get clientName(): string | undefined {
    return this.props.clientName;
  }

  complete(now = new Date()): FollowUp {
    if (this.props.status !== FollowUpStatus.PENDING) {
      throw new InvalidFollowUpError('The follow-up is already completed.');
    }
    return new FollowUp({
      ...this.props,
      status: FollowUpStatus.COMPLETED,
      completedAt: now,
    });
  }

  withClientName(clientName: string): FollowUp {
    return new FollowUp({ ...this.props, clientName });
  }

  toJSON(): FollowUpProps {
    return { ...this.props };
  }
}
