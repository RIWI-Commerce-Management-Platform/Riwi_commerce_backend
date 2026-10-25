import { describe, expect, it } from 'vitest';
import { VisitAttachment } from './visit-attachment.entity.js';

describe('VisitAttachment', () => {
  const props = {
    id: 3,
    visitId: 1,
    fileKey: 'visits/1/report.pdf',
    originalName: 'report.pdf',
    mimeType: 'application/pdf',
    size: 2048,
    uploadedById: 20,
    createdAt: new Date('2026-10-20T15:00:00.000Z'),
  };

  it('exposes its properties', () => {
    const attachment = new VisitAttachment(props);

    expect(attachment.id).toBe(3);
    expect(attachment.visitId).toBe(1);
    expect(attachment.fileKey).toBe('visits/1/report.pdf');
    expect(attachment.originalName).toBe('report.pdf');
    expect(attachment.mimeType).toBe('application/pdf');
    expect(attachment.size).toBe(2048);
    expect(attachment.uploadedById).toBe(20);
    expect(attachment.createdAt).toEqual(props.createdAt);
  });

  it('flags images only for image mime types', () => {
    expect(new VisitAttachment(props).isImage).toBe(false);
    expect(
      new VisitAttachment({ ...props, mimeType: 'image/jpeg' }).isImage,
    ).toBe(true);
  });

  it('serializes to a copy of its props', () => {
    const json = new VisitAttachment(props).toJSON();

    expect(json).toEqual(props);
    expect(json).not.toBe(props);
  });
});
