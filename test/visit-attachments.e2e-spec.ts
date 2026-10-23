import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetVisitAgendaUseCase } from '../src/modules/visit/application/use-cases/get-visit-agenda.use-case.js';
import { GetVisitByIdUseCase } from '../src/modules/visit/application/use-cases/get-visit-by-id.use-case.js';
import { StartVisitUseCase } from '../src/modules/visit/application/use-cases/start-visit.use-case.js';
import { RegisterVisitResultUseCase } from '../src/modules/visit/application/use-cases/register-visit-result.use-case.js';
import { RescheduleVisitUseCase } from '../src/modules/visit/application/use-cases/reschedule-visit.use-case.js';
import { MarkVisitNotVisitedUseCase } from '../src/modules/visit/application/use-cases/mark-visit-not-visited.use-case.js';
import { GetVisitAttachmentsUseCase } from '../src/modules/visit/application/use-cases/get-visit-attachments.use-case.js';
import { UploadVisitAttachmentUseCase } from '../src/modules/visit/application/use-cases/upload-visit-attachment.use-case.js';
import { VisitsController } from '../src/modules/visit/presentation/controllers/visit.controller.js';
import { CurrentAdvisorProvider } from '../src/shared/auth/domain/current-advisor.provider.js';
import { HeaderCurrentAdvisorProvider } from '../src/shared/auth/infrastructure/header-current-advisor.provider.js';

describe('Visit attachment endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let uploadAttachment: { execute: ReturnType<typeof vi.fn> };
  let getAttachments: { execute: ReturnType<typeof vi.fn> };

  const attachment = {
    id: 7,
    visitId: 1,
    key: 'visits/1/photo.png',
    originalName: 'photo.png',
    mimetype: 'image/png',
    size: 5,
    createdAt: new Date('2026-10-20T14:00:00.000Z'),
    url: 'https://example.test/photo.png',
  };

  beforeEach(async () => {
    uploadAttachment = {
      execute: vi.fn().mockResolvedValue(attachment),
    };
    getAttachments = {
      execute: vi.fn().mockResolvedValue([attachment]),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [VisitsController],
      providers: [
        { provide: GetVisitAgendaUseCase, useValue: { execute: vi.fn() } },
        { provide: GetVisitByIdUseCase, useValue: { execute: vi.fn() } },
        { provide: StartVisitUseCase, useValue: { execute: vi.fn() } },
        { provide: RegisterVisitResultUseCase, useValue: { execute: vi.fn() } },
        { provide: RescheduleVisitUseCase, useValue: { execute: vi.fn() } },
        { provide: MarkVisitNotVisitedUseCase, useValue: { execute: vi.fn() } },
        { provide: GetVisitAttachmentsUseCase, useValue: getAttachments },
        { provide: UploadVisitAttachmentUseCase, useValue: uploadAttachment },
        {
          provide: CurrentAdvisorProvider,
          useClass: HeaderCurrentAdvisorProvider,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('uploads multipart files and returns a temporary preview URL', async () => {
    const file = Buffer.from('photo');

    await request(app.getHttpServer())
      .post('/visits/1/attachments')
      .set('x-user-id', '20')
      .attach('file', file, {
        filename: 'photo.png',
        contentType: 'image/png',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: 7,
          visitId: 1,
          originalName: 'photo.png',
          mimetype: 'image/png',
          url: 'https://example.test/photo.png',
        });
        expect(body).not.toHaveProperty('key');
      });

    expect(uploadAttachment.execute).toHaveBeenCalledWith(
      1,
      20,
      expect.objectContaining({
        filename: 'photo.png',
        mimetype: 'image/png',
        buffer: file,
      }),
    );
  });

  it('lists advisor-scoped attachments with preview URLs', async () => {
    await request(app.getHttpServer())
      .get('/visits/1/attachments')
      .set('x-user-id', '20')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({
          id: 7,
          url: 'https://example.test/photo.png',
        });
      });

    expect(getAttachments.execute).toHaveBeenCalledWith(1, 20);
  });

  it('rejects files larger than the shared 10 MiB storage limit', async () => {
    await request(app.getHttpServer())
      .post('/visits/1/attachments')
      .set('x-user-id', '20')
      .attach('file', Buffer.alloc(10 * 1024 * 1024 + 1), {
        filename: 'large.png',
        contentType: 'image/png',
      })
      .expect(413);

    expect(uploadAttachment.execute).not.toHaveBeenCalled();
  });

  it('rejects uploads without a file and requests without an advisor identity', async () => {
    await request(app.getHttpServer())
      .post('/visits/1/attachments')
      .set('x-user-id', '20')
      .expect(400);

    await request(app.getHttpServer()).get('/visits/1/attachments').expect(401);

    expect(uploadAttachment.execute).not.toHaveBeenCalled();
    expect(getAttachments.execute).not.toHaveBeenCalled();
  });
});
