export interface VisitAttachmentProps {
  id?: number;
  visitId: number;
  fileKey: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedById: number;
  createdAt?: Date;
}

/** Photo or document attached to a visit; the file itself lives in S3 (HU-28). */
export class VisitAttachment {
  constructor(private readonly props: VisitAttachmentProps) {}

  get id(): number | undefined {
    return this.props.id;
  }

  get visitId(): number {
    return this.props.visitId;
  }

  get fileKey(): string {
    return this.props.fileKey;
  }

  get originalName(): string {
    return this.props.originalName;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get size(): number {
    return this.props.size;
  }

  get uploadedById(): number {
    return this.props.uploadedById;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  /** Images get a thumbnail in the frontend; other files get a link. */
  get isImage(): boolean {
    return this.props.mimeType.startsWith('image/');
  }

  toJSON(): VisitAttachmentProps {
    return { ...this.props };
  }
}
