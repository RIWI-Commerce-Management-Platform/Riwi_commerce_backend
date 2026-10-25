import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';

/**
 * HU-37 against a real PostgreSQL: HTTP + Better Auth session + RolesGuard +
 * the TypeORM DAO. Loads its own data in two new zones for the week of
 * Monday 2025-03-03 (America/Bogota, UTC-5) and removes it afterwards.
 */
describe('Tracking visits (e2e, PostgreSQL)', () => {
  let app: INestApplication<App>;
  let db: DataSource;
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const password = 'Password123!';
  const week = '2025-03-03';

  const ids = {
    zoneA: 0,
    zoneB: 0,
    routeA: 0,
    clientA: 0,
    clientB: 0,
    users: {} as Record<string, number>,
    visits: {} as Record<string, number>,
  };
  const cookies: Record<string, string> = {};

  const createUser = async (
    key: string,
    role: string,
    zoneId: number | null,
  ) => {
    const email = `hu37_${key}_${suffix}@riwi.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: `HU-37 ${key}`, email, password })
      .expect(201);
    await db.query(
      'UPDATE "user" SET role = $1, "zoneId" = $2 WHERE email = $3',
      [role, zoneId, email],
    );
    const [user] = await db.query('SELECT id FROM "user" WHERE email = $1', [
      email,
    ]);
    ids.users[key] = Number(user.id);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const setCookie = [login.headers['set-cookie']].flat() as string[];
    cookies[key] =
      setCookie
        .find((c) => c.startsWith('better-auth.session_token='))
        ?.split(';')[0] ?? '';
  };

  const insertClient = async (zoneId: number, n: number) => {
    const [row] = await db.query(
      `INSERT INTO clients (nit, business_name, commercial_name, address, department,
         municipality, neighborhood, phone, email, zone_id, client_type_id,
         potential_id, client_status_id, visit_frequency_days)
       VALUES ($1, $2, $2, 'Calle 1', 'Atlántico', 'Barranquilla', 'Centro',
         '3000000000', 'hu37@riwi.com', $3,
         (SELECT MIN(id) FROM client_types), (SELECT MIN(id) FROM potentials),
         (SELECT MIN(id) FROM client_statuses), 7)
       RETURNING id`,
      [`HU37-${suffix}-${n}`, `HU-37 client ${n}`, zoneId],
    );
    return Number(row.id);
  };

  const insertVisit = async (
    key: string,
    clientId: number,
    advisorId: number,
    at: string,
    status: string,
    routeId: number | null = null,
  ) => {
    const [row] = await db.query(
      `INSERT INTO visits (client_id, advisor_id, route_id, scheduled_at, status, order_generated)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [clientId, advisorId, routeId, at, status, key === 'v1'],
    );
    ids.visits[key] = Number(row.id);
  };

  const list = (cookie: string, query: Record<string, string | number> = {}) =>
    request(app.getHttpServer())
      .get('/tracking/visits')
      .query(query)
      .set('Cookie', cookie);

  const visitIds = (body: { data: { visitId: number }[] }) =>
    body.data.map((row) => row.visitId);

  /** Independent count with plain UTC instants instead of AT TIME ZONE. */
  const countFromSql = async (zoneId?: number) => {
    const [row] = await db.query(
      `SELECT COUNT(*)::int AS total FROM visits v, clients c
        WHERE c.id = v.client_id
          AND v.scheduled_at >= '2025-03-03T05:00:00Z'
          AND v.scheduled_at < '2025-03-10T05:00:00Z'
          AND ($1::int IS NULL OR c.zone_id = $1)`,
      [zoneId ?? null],
    );
    return row.total;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    db = app.get(DataSource);

    const [zoneA] = await db.query(
      'INSERT INTO zones (name) VALUES ($1) RETURNING id',
      [`HU-37 A ${suffix}`],
    );
    const [zoneB] = await db.query(
      'INSERT INTO zones (name) VALUES ($1) RETURNING id',
      [`HU-37 B ${suffix}`],
    );
    ids.zoneA = Number(zoneA.id);
    ids.zoneB = Number(zoneB.id);

    await createUser('admin', 'ADMIN', null);
    await createUser('director', 'DIRECTOR_REGIONAL', ids.zoneA);
    // "user_role_zone_check": only regional directors have a zone.
    await createUser('advisor', 'ASESOR', null);

    const [route] = await db.query(
      `INSERT INTO routes (name, zone_id, advisor_id, day_of_week, frequency, start_date, status)
       VALUES ($1, $2, $3, 'MONDAY', 'WEEKLY', '2025-03-03', 'ASSIGNED') RETURNING id`,
      [`HU-37 route ${suffix}`, ids.zoneA, ids.users.advisor],
    );
    ids.routeA = Number(route.id);
    ids.clientA = await insertClient(ids.zoneA, 1);
    ids.clientB = await insertClient(ids.zoneB, 2);

    const advisor = ids.users.advisor;
    // Zone A: 4 visits in the week (v1..v4), 2 outside it.
    await insertVisit(
      'v1',
      ids.clientA,
      advisor,
      '2025-03-03T05:00:00Z',
      'VISITED',
      ids.routeA,
    ); // Mon 00:00
    await insertVisit(
      'v2',
      ids.clientA,
      advisor,
      '2025-03-04T15:00:00Z',
      'PENDING',
      ids.routeA,
    );
    await insertVisit(
      'v3',
      ids.clientA,
      advisor,
      '2025-03-05T15:00:00Z',
      'NOT_VISITED',
    );
    await insertVisit(
      'v4',
      ids.clientA,
      advisor,
      '2025-03-10T04:59:59Z',
      'RESCHEDULE',
    ); // Sun 23:59:59
    await insertVisit(
      'out1',
      ids.clientA,
      advisor,
      '2025-03-10T05:00:00Z',
      'PENDING',
    ); // next Mon
    await insertVisit(
      'out2',
      ids.clientA,
      advisor,
      '2025-03-03T04:59:00Z',
      'VISITED',
    ); // prev Sun
    // Zone B: 1 visit in the week, by another advisor.
    await insertVisit(
      'v5',
      ids.clientB,
      ids.users.admin,
      '2025-03-04T16:00:00Z',
      'VISITED',
    );
  });

  afterAll(async () => {
    if (db?.isInitialized) {
      const clients = [ids.clientA, ids.clientB];
      const users = Object.values(ids.users);
      await db.query('DELETE FROM visits WHERE client_id = ANY($1)', [clients]);
      await db.query('DELETE FROM routes WHERE id = $1', [ids.routeA]);
      await db.query('DELETE FROM clients WHERE id = ANY($1)', [clients]);
      await db.query('DELETE FROM session WHERE "userId" = ANY($1)', [users]);
      await db.query('DELETE FROM account WHERE "userId" = ANY($1)', [users]);
      await db.query('DELETE FROM "user" WHERE id = ANY($1)', [users]);
      await db.query('DELETE FROM zones WHERE id = ANY($1)', [
        [ids.zoneA, ids.zoneB],
      ]);
    }
    await app?.close();
  });

  describe('authorization', () => {
    it('rejects a request without a session (401)', async () => {
      await request(app.getHttpServer()).get('/tracking/visits').expect(401);
    });

    it('rejects an advisor (403)', async () => {
      await list(cookies.advisor, { weekStart: week }).expect(403);
    });

    it("never shows a director another territory's visits", async () => {
      const res = await list(cookies.director, {
        weekStart: week,
        territoryId: ids.zoneB,
      }).expect(200);

      expect(visitIds(res.body)).toEqual([
        ids.visits.v1,
        ids.visits.v2,
        ids.visits.v3,
        ids.visits.v4,
      ]);
    });
  });

  describe('table data', () => {
    it('returns the visits of the week with every column and matches SQL', async () => {
      const res = await list(cookies.admin, {
        weekStart: week,
        territoryId: ids.zoneA,
      }).expect(200);

      expect(res.body.weekStart).toBe('2025-03-03');
      expect(res.body.weekEnd).toBe('2025-03-09');
      expect(visitIds(res.body)).toEqual([
        ids.visits.v1,
        ids.visits.v2,
        ids.visits.v3,
        ids.visits.v4,
      ]);
      expect(res.body.data[0]).toEqual({
        visitId: ids.visits.v1,
        scheduledAt: '2025-03-03T05:00:00.000Z',
        actualDate: null,
        status: 'VISITED',
        quoteGenerated: false,
        orderGenerated: true,
        client: { id: ids.clientA, commercialName: 'HU-37 client 1' },
        zone: { id: ids.zoneA, name: `HU-37 A ${suffix}` },
        advisor: { id: ids.users.advisor, name: 'HU-37 advisor' },
        route: { id: ids.routeA, name: `HU-37 route ${suffix}` },
      });
      expect(res.body.data[2].route).toBeNull();
      expect(res.body.meta.total).toBe(await countFromSql(ids.zoneA));
    });

    it('counts every territory without a filter, like SQL', async () => {
      const res = await list(cookies.admin, { weekStart: week }).expect(200);

      expect(res.body.meta.total).toBe(await countFromSql());
      expect(visitIds(res.body)).toContain(ids.visits.v5);
    });

    it('turns any day into the Monday–Sunday week that contains it', async () => {
      const res = await list(cookies.admin, {
        weekStart: '2025-03-09',
        territoryId: ids.zoneA,
      }).expect(200);

      expect(res.body.weekStart).toBe('2025-03-03');
      expect(res.body.meta.total).toBe(4);
    });

    it('returns an empty page for a week without visits', async () => {
      const res = await list(cookies.admin, {
        weekStart: '2001-01-01',
        territoryId: ids.zoneA,
      }).expect(200);

      expect(res.body.data).toEqual([]);
      expect(res.body.meta).toEqual({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });
  });

  describe('filters', () => {
    const inZoneA = (filter: Record<string, string | number>) =>
      list(cookies.admin, {
        weekStart: week,
        territoryId: ids.zoneA,
        ...filter,
      });

    it.each([
      ['PENDING', 'v2'],
      ['RESCHEDULE', 'v4'],
      ['NOT_VISITED', 'v3'],
    ])('filters by status %s', async (status, visit) => {
      const res = await inZoneA({ status }).expect(200);

      expect(visitIds(res.body)).toEqual([ids.visits[visit]]);
    });

    it('filters by route', async () => {
      const res = await inZoneA({ routeId: ids.routeA }).expect(200);

      expect(visitIds(res.body)).toEqual([ids.visits.v1, ids.visits.v2]);
    });

    it('filters by advisor', async () => {
      const res = await list(cookies.admin, {
        weekStart: week,
        advisorId: ids.users.admin,
      }).expect(200);

      expect(visitIds(res.body)).toEqual([ids.visits.v5]);
    });
  });

  describe('order and pagination', () => {
    it('orders by scheduled date descending', async () => {
      const res = await list(cookies.admin, {
        weekStart: week,
        territoryId: ids.zoneA,
        order: 'desc',
      }).expect(200);

      expect(visitIds(res.body)).toEqual([
        ids.visits.v4,
        ids.visits.v3,
        ids.visits.v2,
        ids.visits.v1,
      ]);
    });

    it('returns the requested page with its meta', async () => {
      const res = await list(cookies.admin, {
        weekStart: week,
        territoryId: ids.zoneA,
        page: 2,
        limit: 3,
      }).expect(200);

      expect(visitIds(res.body)).toEqual([ids.visits.v4]);
      expect(res.body.meta).toEqual({
        total: 4,
        page: 2,
        limit: 3,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });
  });

  describe('validation', () => {
    it.each([
      [{ weekStart: '2025-02-30' }],
      [{ territoryId: 'abc' }],
      [{ status: 'DONE' }],
      [{ order: 'up' }],
    ])('%o -> 400', async (query) => {
      const res = await list(cookies.admin, query).expect(400);

      expect(res.body).toHaveProperty('message');
    });
  });
});
