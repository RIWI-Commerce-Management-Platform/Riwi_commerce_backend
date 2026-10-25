import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';

/**
 * HU-36 against a real PostgreSQL: HTTP + Better Auth session + RolesGuard +
 * the TypeORM DAO. Loads its own data in two new zones for Monday
 * 2025-03-03 (America/Bogota, UTC-5) and removes it afterwards.
 */
describe('Visit map (e2e, PostgreSQL)', () => {
  let app: INestApplication<App>;
  let db: DataSource;
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const password = 'Password123!';
  const day = '2025-03-03';

  const ids = {
    zoneA: 0,
    zoneB: 0,
    clients: {} as Record<string, number>,
    users: {} as Record<string, number>,
    visits: {} as Record<string, number>,
  };
  const cookies: Record<string, string> = {};

  const createUser = async (
    key: string,
    role: string,
    zoneId: number | null,
  ) => {
    const email = `hu36_${key}_${suffix}@riwi.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: `HU-36 ${key}`, email, password })
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

  const insertClient = async (
    key: string,
    zoneId: number,
    latitude: number | null,
    longitude: number | null,
  ) => {
    const [row] = await db.query(
      `INSERT INTO clients (nit, business_name, commercial_name, address, department,
         municipality, neighborhood, phone, email, zone_id, client_type_id,
         potential_id, client_status_id, visit_frequency_days, latitude, longitude)
       VALUES ($1, $2, $2, 'Calle 72 # 50-10', 'Atlántico', 'Barranquilla', 'Centro',
         '3000000000', 'hu36@riwi.com', $3,
         (SELECT MIN(id) FROM client_types), (SELECT MIN(id) FROM potentials),
         (SELECT MIN(id) FROM client_statuses), 7, $4, $5)
       RETURNING id`,
      // nit is varchar(30): keep it short.
      [
        `HU36-${suffix}-${Object.keys(ids.clients).length}`,
        `HU-36 ${key}`,
        zoneId,
        latitude,
        longitude,
      ],
    );
    ids.clients[key] = Number(row.id);
  };

  const insertVisit = async (
    key: string,
    client: string,
    at: string,
    status: string,
    orderGenerated = false,
    advisor = 'advisor',
  ) => {
    const [row] = await db.query(
      `INSERT INTO visits (client_id, advisor_id, scheduled_at, status, order_generated)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [ids.clients[client], ids.users[advisor], at, status, orderGenerated],
    );
    ids.visits[key] = Number(row.id);
  };

  const getMap = (
    cookie: string,
    query: Record<string, string | number> = {},
  ) =>
    request(app.getHttpServer())
      .get('/visit-map')
      .query(query)
      .set('Cookie', cookie);

  const visitIds = (body: { data: { visitId: number }[] }) =>
    body.data.map((marker) => marker.visitId);

  /**
   * Independent check with plain UTC instants (Bogotá is UTC-5, no DST)
   * instead of the DAO's AT TIME ZONE expressions.
   */
  const fromSql = async (zoneId?: number) => {
    const [row] = await db.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE c.latitude BETWEEN -90 AND 90
                                 AND c.longitude BETWEEN -180 AND 180)::int AS located
         FROM visits v JOIN clients c ON c.id = v.client_id
        WHERE v.scheduled_at >= '2025-03-03T05:00:00Z'
          AND v.scheduled_at < '2025-03-04T05:00:00Z'
          AND ($1::int IS NULL OR c.zone_id = $1)`,
      [zoneId ?? null],
    );
    return { total: row.total, withoutLocation: row.total - row.located };
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
      [`HU-36 A ${suffix}`],
    );
    const [zoneB] = await db.query(
      'INSERT INTO zones (name) VALUES ($1) RETURNING id',
      [`HU-36 B ${suffix}`],
    );
    ids.zoneA = Number(zoneA.id);
    ids.zoneB = Number(zoneB.id);

    await createUser('admin', 'ADMIN', null);
    await createUser('director', 'DIRECTOR_REGIONAL', ids.zoneA);
    // "user_role_zone_check": only regional directors have a zone.
    await createUser('advisor', 'ASESOR', null);

    await insertClient('located', ids.zoneA, 10.9925, -74.793);
    await insertClient('noLocation', ids.zoneA, null, null);
    await insertClient('outOfRange', ids.zoneA, 123.4, -74.8);
    await insertClient('zoneB', ids.zoneB, 10.91, -74.77);

    // Zone A, 2025-03-03 in Bogotá: one visit per legend category.
    await insertVisit(
      'orderClosed',
      'located',
      '2025-03-03T05:00:00Z',
      'VISITED',
      true,
    ); // 00:00
    await insertVisit('visited', 'located', '2025-03-03T12:00:00Z', 'VISITED');
    await insertVisit(
      'pending',
      'noLocation',
      '2025-03-03T13:00:00Z',
      'PENDING',
    );
    await insertVisit(
      'inProgress',
      'located',
      '2025-03-03T14:00:00Z',
      'IN_PROGRESS',
    );
    await insertVisit(
      'notVisited',
      'outOfRange',
      '2025-03-03T15:00:00Z',
      'NOT_VISITED',
    );
    await insertVisit(
      'rescheduled',
      'located',
      '2025-03-04T04:59:59Z',
      'RESCHEDULE',
    ); // 23:59:59
    await insertVisit('nextDay', 'located', '2025-03-04T05:00:00Z', 'PENDING'); // out
    await insertVisit(
      'previousDay',
      'located',
      '2025-03-03T04:59:00Z',
      'VISITED',
    ); // out
    // Zone B, same day, another advisor.
    await insertVisit(
      'zoneB',
      'zoneB',
      '2025-03-03T16:00:00Z',
      'PENDING',
      false,
      'admin',
    );
  });

  afterAll(async () => {
    if (db?.isInitialized) {
      const clients = Object.values(ids.clients);
      const users = Object.values(ids.users);
      await db.query('DELETE FROM visits WHERE client_id = ANY($1)', [clients]);
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
      await request(app.getHttpServer()).get('/visit-map').expect(401);
    });

    it('rejects an advisor (403)', async () => {
      await getMap(cookies.advisor, { date: day }).expect(403);
    });

    it("never shows a director another territory's visits", async () => {
      const res = await getMap(cookies.director, {
        date: day,
        territoryId: ids.zoneB,
      }).expect(200);

      expect(res.body.total).toBe(6);
      expect(visitIds(res.body)).not.toContain(ids.visits.zoneB);
      expect(
        res.body.data.every(
          (marker: { zone: { id: number } }) => marker.zone.id === ids.zoneA,
        ),
      ).toBe(true);
    });
  });

  describe('markers', () => {
    it('returns the day of territory A with one marker per legend category', async () => {
      const res = await getMap(cookies.admin, {
        date: day,
        territoryId: ids.zoneA,
      }).expect(200);

      expect(res.body.date).toBe(day);
      expect(visitIds(res.body)).toEqual(
        [
          'orderClosed',
          'visited',
          'pending',
          'inProgress',
          'notVisited',
          'rescheduled',
        ].map((key) => ids.visits[key]),
      );
      expect(
        res.body.data.map((marker: { mapStatus: string }) => marker.mapStatus),
      ).toEqual([
        'ORDER_CLOSED',
        'VISITED',
        'PENDING',
        'PENDING',
        'NOT_VISITED',
        'RESCHEDULED',
      ]);
      expect(res.body.counts).toEqual({
        VISITED: 1,
        PENDING: 2,
        NOT_VISITED: 1,
        ORDER_CLOSED: 1,
        RESCHEDULED: 1,
      });
      expect(res.body).toMatchObject(await fromSql(ids.zoneA));
    });

    it('sends the client data and coordinates of a marker', async () => {
      const res = await getMap(cookies.admin, {
        date: day,
        territoryId: ids.zoneA,
      }).expect(200);

      expect(res.body.data[0]).toEqual({
        visitId: ids.visits.orderClosed,
        scheduledAt: '2025-03-03T05:00:00.000Z',
        status: 'VISITED',
        mapStatus: 'ORDER_CLOSED',
        orderGenerated: true,
        location: { latitude: 10.9925, longitude: -74.793 },
        client: {
          id: ids.clients.located,
          commercialName: 'HU-36 located',
          address: 'Calle 72 # 50-10',
          municipality: 'Barranquilla',
        },
        zone: { id: ids.zoneA, name: `HU-36 A ${suffix}` },
        advisor: { id: ids.users.advisor, name: 'HU-36 advisor' },
        route: null,
      });
    });

    it('keeps visits without valid coordinates with a null location', async () => {
      const res = await getMap(cookies.admin, {
        date: day,
        territoryId: ids.zoneA,
      }).expect(200);
      const byId = (key: string) =>
        res.body.data.find(
          (marker: { visitId: number }) => marker.visitId === ids.visits[key],
        );

      expect(res.body.withoutLocation).toBe(2);
      expect(byId('pending').location).toBeNull();
      expect(byId('notVisited').location).toBeNull();
    });
  });

  describe('filters', () => {
    it('includes every territory without a filter, like SQL', async () => {
      const res = await getMap(cookies.admin, { date: day }).expect(200);

      expect(res.body).toMatchObject(await fromSql());
      expect(visitIds(res.body)).toContain(ids.visits.zoneB);
    });

    it('filters by advisor', async () => {
      const res = await getMap(cookies.admin, {
        date: day,
        advisorId: ids.users.admin,
      }).expect(200);

      expect(visitIds(res.body)).toEqual([ids.visits.zoneB]);
    });

    it('returns zeros for a day without visits', async () => {
      const res = await getMap(cookies.admin, {
        date: '2001-01-01',
        territoryId: ids.zoneA,
      }).expect(200);

      expect(res.body).toEqual({
        date: '2001-01-01',
        total: 0,
        withoutLocation: 0,
        counts: {
          VISITED: 0,
          PENDING: 0,
          NOT_VISITED: 0,
          ORDER_CLOSED: 0,
          RESCHEDULED: 0,
        },
        data: [],
      });
    });

    it('defaults to today in Bogotá', async () => {
      const [{ today }] = await db.query(
        `SELECT to_char((now() AT TIME ZONE 'America/Bogota')::date, 'YYYY-MM-DD') AS today`,
      );

      const res = await getMap(cookies.admin).expect(200);

      expect(res.body.date).toBe(today);
    });
  });

  describe('validation', () => {
    it.each([
      [{ date: '2025-02-30' }],
      [{ date: '03/03/2025' }],
      [{ territoryId: 'abc' }],
      [{ advisorId: 0 }],
    ])('%o -> 400', async (query) => {
      const res = await getMap(cookies.admin, query).expect(400);

      expect(res.body).toHaveProperty('message');
    });
  });
});
