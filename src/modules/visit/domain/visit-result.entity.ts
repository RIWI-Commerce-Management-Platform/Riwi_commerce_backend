export interface VisitResultOptionProps {
  id: number;
  name: string;
  isActive: boolean;
}

export class VisitResultOption {
  constructor(private readonly props: VisitResultOptionProps) {}

  get id(): number {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  toJSON(): VisitResultOptionProps {
    return { ...this.props };
  }
}
