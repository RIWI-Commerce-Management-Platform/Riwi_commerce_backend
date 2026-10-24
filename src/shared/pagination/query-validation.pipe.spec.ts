import { describe, expect, it } from 'vitest';
import { Controller, Get, INestApplication, Query } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { queryValidationPipe } from './query-validation.pipe.js';
import { FindClientsQueryDto } from '../../modules/clients/presentation/dto/find-clients-query.dto.js';
import { FindRoutesQueryDto } from '../../modules/routes/presentation/dto/find-routes-query.dto.js';

@Controller('probe')
class ProbeController {
  @Get('clients')
  clients(@Query(queryValidationPipe()) query: FindClientsQueryDto) {
    return {
      zoneId: query.parsedZoneId,
      potentialId: query.parsedPotentialId,
      isActive: query.parsedIsActive,
      page: query.parsedPage,
      limit: query.parsedLimit,
      search: query.search,
    };
  }

  @Get('routes')
  routes(@Query(queryValidationPipe()) query: FindRoutesQueryDto) {
    return {
      zoneId: query.zoneId,
      isActive: query.isActive,
      page: query.parsedPage,
      limit: query.parsedLimit,
    };
  }
}

describe('queryValidationPipe (over HTTP)', () => {
  const createApp = async (): Promise<INestApplication> => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    return app;
  };

  it('turns the raw query into the DTO so its getters work', async () => {
    const app = await createApp();

    const res = await request(app.getHttpServer()).get(
      '/probe/clients?zoneId=2&potentialId=1&isActive=false&page=3&limit=5&search=andes',
    );

    expect(res.body).toEqual({
      zoneId: 2,
      potentialId: 1,
      isActive: false,
      page: 3,
      limit: 5,
      search: 'andes',
    });
    await app.close();
  });

  it('keeps isActive=false as false for routes and parses numeric filters', async () => {
    const app = await createApp();

    const res = await request(app.getHttpServer()).get(
      '/probe/routes?zoneId=4&isActive=false&page=2&limit=20',
    );

    expect(res.body).toEqual({
      zoneId: 4,
      isActive: false,
      page: 2,
      limit: 20,
    });
    await app.close();
  });

  it('rejects an invalid route filter with 400', async () => {
    const app = await createApp();

    const res = await request(app.getHttpServer()).get(
      '/probe/routes?isActive=maybe',
    );

    expect(res.status).toBe(400);
    await app.close();
  });
});
