import {
  NewVisitAttachment,
  VisitAttachment,
} from '../visit-attachment.entity.js';

export abstract class VisitAttachmentDao {
  abstract create(attachment: NewVisitAttachment): Promise<VisitAttachment>;

  abstract findByVisitId(visitId: number): Promise<VisitAttachment[]>;
}
