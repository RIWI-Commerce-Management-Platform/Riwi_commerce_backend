import { ApiProperty } from '@nestjs/swagger';

import { VisitAttachmentWithUrl } from '../../domain/visit-attachment.entity.js';

export class VisitAttachmentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  visitId: number;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimetype: string;

  @ApiProperty()
  size: number;

  @ApiProperty({
    description: 'Temporary URL for previewing or downloading the attachment.',
  })
  url: string;

  @ApiProperty()
  createdAt: Date;

  constructor(attachment: VisitAttachmentWithUrl) {
    this.id = attachment.id;
    this.visitId = attachment.visitId;
    this.originalName = attachment.originalName;
    this.mimetype = attachment.mimetype;
    this.size = attachment.size;
    this.url = attachment.url;
    this.createdAt = attachment.createdAt;
  }
}
