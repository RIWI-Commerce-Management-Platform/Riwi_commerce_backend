export interface VisitResultLinkProps {
  visitId: number;
  resultId: number;
  observation: string | null;
}

export class VisitResultLink {
  constructor(private readonly props: VisitResultLinkProps) {}

  get visitId(): number {
    return this.props.visitId;
  }

  get resultId(): number {
    return this.props.resultId;
  }

  get observation(): string | null {
    return this.props.observation;
  }

  toJSON(): VisitResultLinkProps {
    return { ...this.props };
  }
}
