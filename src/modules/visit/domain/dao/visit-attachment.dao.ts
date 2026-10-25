import { VisitAttachment } from '../visit-attachment.entity.js';

export abstract class VisitAttachmentDao {
  abstract save(attachment: VisitAttachment): Promise<VisitAttachment>;
  abstract findByVisitId(visitId: number): Promise<VisitAttachment[]>;
  abstract findById(id: number): Promise<VisitAttachment | null>;
  abstract delete(id: number): Promise<void>;
}
