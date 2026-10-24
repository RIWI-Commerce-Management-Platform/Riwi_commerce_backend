import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { VisitAttachmentWithUrl } from '../../application/use-cases/upload-visit-attachment.use-case.js';

export class VisitAttachmentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  visitId: number;

  @ApiProperty({ example: 'store-front.jpg' })
  originalName: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType: string;

  @ApiProperty({ description: 'Size in bytes' })
  size: number;

  @ApiProperty({
    description:
      'True for images: the frontend shows a thumbnail instead of a link.',
  })
  isImage: boolean;

  @ApiProperty({ description: 'Temporary signed S3 URL (1 hour)' })
  url: string;

  @ApiPropertyOptional()
  createdAt?: Date;

  constructor({ attachment, url }: VisitAttachmentWithUrl) {
    this.id = attachment.id!;
    this.visitId = attachment.visitId;
    this.originalName = attachment.originalName;
    this.mimeType = attachment.mimeType;
    this.size = attachment.size;
    this.isImage = attachment.isImage;
    this.url = url;
    this.createdAt = attachment.createdAt;
  }
}
