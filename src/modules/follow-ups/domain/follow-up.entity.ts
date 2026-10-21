export interface FollowUpProps {
  id: number;
  visitId: number;
  nextDate: Date;
  activity: string;
  observation?: string | null;
  responsibleAdvisorId: number;
  completed: boolean;
}

export class FollowUp {
  constructor(private readonly props: FollowUpProps) {}

  get id(): number {
    return this.props.id;
  }

  get visitId(): number {
    return this.props.visitId;
  }

  get nextDate(): Date {
    return this.props.nextDate;
  }

  get activity(): string {
    return this.props.activity;
  }

  get observation(): string | null | undefined {
    return this.props.observation;
  }

  get responsibleAdvisorId(): number {
    return this.props.responsibleAdvisorId;
  }

  get completed(): boolean {
    return this.props.completed;
  }

  markCompleted(): FollowUp {
    if (this.props.completed) {
      return this;
    }

    return new FollowUp({
      ...this.props,
      completed: true,
    });
  }

  toJSON(): FollowUpProps {
    return { ...this.props };
  }
}
