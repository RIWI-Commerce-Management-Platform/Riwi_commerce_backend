export interface VisitAttachment {
  id: number;
  visitId: number;
  key: string;
  originalName: string;
  mimetype: string;
  size: number;
  createdAt: Date;
}

export interface VisitAttachmentWithUrl extends VisitAttachment {
  url: string;
}

export type NewVisitAttachment = Omit<VisitAttachment, 'id' | 'createdAt'>;
