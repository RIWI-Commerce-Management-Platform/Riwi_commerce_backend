import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { vi } from 'vitest';

import { CompleteFollowUpUseCase } from '../src/modules/follow-ups/application/complete-follow-up.use-case.js';
import { CreateFollowUpUseCase } from '../src/modules/follow-ups/application/create-follow-up.use-case.js';
import { ListFollowUpsUseCase } from '../src/modules/follow-ups/application/list-follow-ups.use-case.js';
import { FollowUp } from '../src/modules/follow-ups/domain/follow-up.entity.js';
import { FollowUpsController } from '../src/modules/follow-ups/presentation/follow-ups.controller.js';
import { CurrentAdvisorProvider } from '../src/shared/auth/domain/current-advisor.provider.js';
import { HeaderCurrentAdvisorProvider } from '../src/shared/auth/infrastructure/header-current-advisor.provider.js';

describe('FollowUpsController (e2e)', () => {
  let app: INestApplication<App>;
  let createUseCase: { execute: ReturnType<typeof vi.fn> };
  let completeUseCase: { execute: ReturnType<typeof vi.fn> };
  let listUseCase: {
    execute: ReturnType<typeof vi.fn>;
    getAgenda: ReturnType<typeof vi.fn>;
  };

  const followUp = (completed = false) =>
    new FollowUp({
      id: 12,
      visitId: 41,
      nextDate: new Date('2026-10-25T00:00:00.000Z'),
      activity: 'Confirmar reunión',
      observation: 'Enviar antes la propuesta',
      responsibleAdvisorId: 7,
      completed,
    });

  beforeEach(async () => {
    createUseCase = { execute: vi.fn().mockResolvedValue(followUp()) };
    completeUseCase = {
      execute: vi.fn().mockResolvedValue(followUp(true)),
    };
    listUseCase = {
      execute: vi.fn().mockResolvedValue([followUp()]),
      getAgenda: vi.fn().mockResolvedValue([followUp()]),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FollowUpsController],
      providers: [
        { provide: CreateFollowUpUseCase, useValue: createUseCase },
        { provide: CompleteFollowUpUseCase, useValue: completeUseCase },
        { provide: ListFollowUpsUseCase, useValue: listUseCase },
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

  it('creates a follow-up for the advisor from the request header', async () => {
    await request(app.getHttpServer())
      .post('/follow-ups/visits/41')
      .set('x-user-id', '7')
      .send({
        nextDate: '2026-10-25',
        activity: 'Confirmar reunión',
        observation: 'Enviar antes la propuesta',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: 12,
          visitId: 41,
          activity: 'Confirmar reunión',
          responsibleAdvisorId: 7,
          completed: false,
        });
      });

    expect(createUseCase.execute).toHaveBeenCalledWith(41, 7, {
      nextDate: '2026-10-25',
      activity: 'Confirmar reunión',
      observation: 'Enviar antes la propuesta',
    });
  });

  it('rejects a request with an invalid body before calling the use case', async () => {
    await request(app.getHttpServer())
      .post('/follow-ups/visits/41')
      .set('x-user-id', '7')
      .send({ nextDate: '25-10-2026', activity: '' })
      .expect(400);

    expect(createUseCase.execute).not.toHaveBeenCalled();
  });

  it('lists follow-ups for an authorized visit', async () => {
    await request(app.getHttpServer())
      .get('/follow-ups/visits/41')
      .set('x-user-id', '7')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({ id: 12, visitId: 41 });
      });

    expect(listUseCase.execute).toHaveBeenCalledWith(41, 7);
  });

  it('lists the pending agenda for the requested period', async () => {
    await request(app.getHttpServer())
      .get('/follow-ups/agenda?date=2026-10-25&period=week')
      .set('x-user-id', '7')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({ id: 12, completed: false });
      });

    expect(listUseCase.getAgenda).toHaveBeenCalledWith(7, '2026-10-25', 'week');
  });

  it('rejects unsupported agenda periods', async () => {
    await request(app.getHttpServer())
      .get('/follow-ups/agenda?period=month')
      .set('x-user-id', '7')
      .expect(400);

    expect(listUseCase.getAgenda).not.toHaveBeenCalled();
  });

  it('marks a follow-up as completed', async () => {
    await request(app.getHttpServer())
      .patch('/follow-ups/12/complete')
      .set('x-user-id', '7')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ id: 12, completed: true });
      });

    expect(completeUseCase.execute).toHaveBeenCalledWith(12, 7);
  });

  it('rejects requests without an advisor header', async () => {
    await request(app.getHttpServer()).get('/follow-ups/agenda').expect(401);
  });
});
