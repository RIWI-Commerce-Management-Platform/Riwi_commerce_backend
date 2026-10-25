import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';

/**
 * HU-35 against a real PostgreSQL: HTTP + Better Auth session + RolesGuard +
 * the TypeORM DAO. Loads its own data in two new zones for the week of
 * Monday 2025-03-03 (America/Bogota, UTC-5) and removes it afterwards.
 */
describe('Dashboard KPIs (e2e, PostgreSQL)', () => {
  let app: INestApplication<App>;
  let db: DataSource;
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const password = 'Password123!';
  const week = '2025-03-03';
  // Bogotá has no DST: Monday 00:00 -05:00 is 05:00Z.
  const weekStartsAt = '2025-03-03T05:00:00Z';
  const weekEndsAt = '2025-03-10T05:00:00Z';

  const ids = {
    zoneA: 0,
    zoneB: 0,
    clients: [] as number[],
    users: [] as number[],
  };
  const cookies = { admin: '', director: '', advisor: '' };

  const sessionCookie = (setCookie: string[] | string | undefined): string => {
    const list = Array.isArray(setCookie) ? setCookie : [setCookie ?? ''];
    const cookie = list.find((c) => c.startsWith('better-auth.session_token='));
    return cookie?.split(';')[0] ?? '';
  };

  const createUser = async (
    key: keyof typeof cookies,
    role: string,
    zoneId: number | null,
  ): Promise<void> => {
    const email = `hu35_${key}_${suffix}@riwi.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: `HU-35 ${key}`, email, password })
      .expect(201);
    await db.query(
      'UPDATE "user" SET role = $1, "zoneId" = $2 WHERE email = $3',
      [role, zoneId, email],
    );
    const [user] = await db.query('SELECT id FROM "user" WHERE email = $1', [
      email,
    ]);
    ids.users.push(Number(user.id));
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    cookies[key] = sessionCookie(login.headers['set-cookie']);
  };

  const insertClient = async (zoneId: number, n: number): Promise<number> => {
    const [row] = await db.query(
      `INSERT INTO clients (nit, business_name, commercial_name, address, department,
         municipality, neighborhood, phone, email, zone_id, client_type_id,
         potential_id, client_status_id, visit_frequency_days)
       VALUES ($1, $2, $2, 'Calle 1', 'Atlántico', 'Barranquilla', 'Centro',
         '3000000000', 'hu35@riwi.com', $3,
         (SELECT MIN(id) FROM client_types), (SELECT MIN(id) FROM potentials),
         (SELECT MIN(id) FROM client_statuses), 7)
       RETURNING id`,
      [`HU35-${suffix}-${n}`, `HU-35 client ${n}`, zoneId],
    );
    ids.clients.push(Number(row.id));
    return Number(row.id);
  };

  const insertVisit = (clientId: number, at: string, status: string) =>
    db.query(
      `INSERT INTO visits (client_id, advisor_id, scheduled_at, status)
       VALUES ($1, $2, $3, $4)`,
      [clientId, ids.users[0], at, status],
    );

  let quoteSeq = 0;
  const insertQuote = async (
    clientId: number,
    total: string,
    status: string,
    at: string,
    items = 1,
  ): Promise<number> => {
    quoteSeq += 1;
    const [row] = await db.query(
      `INSERT INTO quotes (quote_number, client_id, status, subtotal, total, created_at)
       VALUES ($1, $2, $3, $4, $4, $5) RETURNING id`,
      [`COT-HU35-${suffix}-${quoteSeq}`, clientId, status, total, at],
    );
    for (let i = 0; i < items; i++) {
      await db.query(
        `INSERT INTO quote_items (quote_id, product_name, quantity, unit_price, subtotal)
         VALUES ($1, 'Product', 1, $2, $2)`,
        [row.id, total],
      );
    }
    return Number(row.id);
  };

  let orderSeq = 0;
  const insertOrder = (
    quoteId: number,
    clientId: number,
    status: string,
    at: string,
  ) => {
    orderSeq += 1;
    return db.query(
      `INSERT INTO orders (order_number, quote_id, client_id, status, subtotal, total, created_at)
       VALUES ($1, $2, $3, $4, 100, 100, $5)`,
      [`PED-HU35-${suffix}-${orderSeq}`, quoteId, clientId, status, at],
    );
  };

  /**
   * Independent check: plain UTC instants instead of the DAO's
   * AT TIME ZONE expressions, and one query per KPI.
   */
  const expectedFromSql = async (zoneId?: number) => {
    const zone = zoneId === undefined ? '' : 'AND c.zone_id = $3';
    const params: unknown[] = [weekStartsAt, weekEndsAt];
    if (zoneId !== undefined) params.push(zoneId);
    const [visits] = await db.query(
      `SELECT COUNT(*)::int AS scheduled,
              SUM(CASE WHEN v.status = 'VISITED' THEN 1 ELSE 0 END)::int AS completed
         FROM visits v, clients c
        WHERE c.id = v.client_id AND v.scheduled_at >= $1 AND v.scheduled_at < $2 ${zone}`,
      params,
    );
    const [quotes] = await db.query(
      `SELECT to_char(COALESCE(SUM(q.total), 0), 'FM9999999999999990.00') AS amount
         FROM quotes q, clients c
        WHERE c.id = q.client_id AND q.created_at >= $1 AND q.created_at < $2 ${zone}`,
      params,
    );
    const [orders] = await db.query(
      `SELECT COUNT(*)::int AS closed
         FROM orders o, clients c
        WHERE c.id = o.client_id AND o.created_at >= $1 AND o.created_at < $2
          AND o.status <> 'CANCELLED' ${zone}`,
      params,
    );
    return {
      scheduledVisits: visits.scheduled,
      completedVisits: visits.completed ?? 0,
      quotedAmount: quotes.amount,
      closedOrders: orders.closed,
    };
  };

  const getKpis = (cookie: string, query: Record<string, string | number>) =>
    request(app.getHttpServer())
      .get('/dashboard/kpis')
      .query(query)
      .set('Cookie', cookie);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    db = app.get(DataSource);

    const [zoneA] = await db.query(
      'INSERT INTO zones (name) VALUES ($1) RETURNING id',
      [`HU-35 A ${suffix}`],
    );
    const [zoneB] = await db.query(
      'INSERT INTO zones (name) VALUES ($1) RETURNING id',
      [`HU-35 B ${suffix}`],
    );
    ids.zoneA = Number(zoneA.id);
    ids.zoneB = Number(zoneB.id);

    await createUser('admin', 'ADMIN', null);
    await createUser('director', 'DIRECTOR_REGIONAL', ids.zoneA);
    // "user_role_zone_check": only regional directors have a zone.
    await createUser('advisor', 'ASESOR', null);

    const clientA = await insertClient(ids.zoneA, 1);
    const clientA2 = await insertClient(ids.zoneA, 2);
    const clientB = await insertClient(ids.zoneB, 3);

    // Zone A: 4 scheduled in the week, 2 visited.
    await insertVisit(clientA, '2025-03-03T05:00:00Z', 'VISITED'); // Mon 00:00 (in)
    await insertVisit(clientA, '2025-03-10T04:59:59Z', 'PENDING'); // Sun 23:59:59 (in)
    await insertVisit(clientA2, '2025-03-05T15:00:00Z', 'NOT_VISITED');
    await insertVisit(clientA2, '2025-03-06T15:00:00Z', 'VISITED');
    await insertVisit(clientA, '2025-03-10T05:00:00Z', 'VISITED'); // next Mon 00:00 (out)
    await insertVisit(clientA, '2025-03-03T04:59:00Z', 'VISITED'); // prev Sun 23:59, UTC Monday (out)
    // Zone B: 2 scheduled, 1 visited.
    await insertVisit(clientB, '2025-03-04T15:00:00Z', 'VISITED');
    await insertVisit(clientB, '2025-03-04T16:00:00Z', 'PENDING');

    // Zone A quotes in the week: 1000.10 + 2000.25 + 0.01 = 3000.36.
    const q1 = await insertQuote(
      clientA,
      '1000.10',
      'SENT',
      '2025-03-04T15:00:00Z',
      3,
    );
    const q2 = await insertQuote(
      clientA,
      '2000.25',
      'APPROVED',
      '2025-03-05T15:00:00Z',
    );
    const q3 = await insertQuote(
      clientA2,
      '0.01',
      'REJECTED',
      '2025-03-10T04:00:00Z',
    );
    await insertQuote(clientA, '999.99', 'DRAFT', '2025-03-10T05:00:00Z'); // out
    const qOld = await insertQuote(
      clientA2,
      '50.00',
      'APPROVED',
      '2025-02-25T15:00:00Z',
    ); // out
    // Zone B: 500.50.
    const q5 = await insertQuote(
      clientB,
      '500.50',
      'SENT',
      '2025-03-04T15:00:00Z',
    );

    // Zone A orders in the week: 2 closed, 1 cancelled.
    await insertOrder(q2, clientA, 'CREATED', '2025-03-05T16:00:00Z');
    await insertOrder(q1, clientA, 'CANCELLED', '2025-03-05T16:00:00Z');
    await insertOrder(qOld, clientA2, 'DISPATCHED', '2025-03-07T16:00:00Z');
    await insertOrder(q3, clientA2, 'DELIVERED', '2025-03-11T16:00:00Z'); // out
    // Zone B: 1 delivered.
    await insertOrder(q5, clientB, 'DELIVERED', '2025-03-04T16:00:00Z');
  });

  afterAll(async () => {
    if (db?.isInitialized) {
      const clients = ids.clients;
      await db.query('DELETE FROM orders WHERE client_id = ANY($1)', [clients]);
      await db.query('DELETE FROM quotes WHERE client_id = ANY($1)', [clients]);
      await db.query('DELETE FROM visits WHERE client_id = ANY($1)', [clients]);
      await db.query('DELETE FROM clients WHERE id = ANY($1)', [clients]);
      await db.query('DELETE FROM session WHERE "userId" = ANY($1)', [
        ids.users,
      ]);
      await db.query('DELETE FROM account WHERE "userId" = ANY($1)', [
        ids.users,
      ]);
      await db.query('DELETE FROM "user" WHERE id = ANY($1)', [ids.users]);
      await db.query('DELETE FROM zones WHERE id = ANY($1)', [
        [ids.zoneA, ids.zoneB],
      ]);
    }
    await app?.close();
  });

  describe('authorization', () => {
    it('rejects a request without a session (401)', async () => {
      await request(app.getHttpServer()).get('/dashboard/kpis').expect(401);
    });

    it('rejects an advisor (403)', async () => {
      await getKpis(cookies.advisor, { weekStart: week }).expect(403);
    });

    it("never shows a director another territory's data", async () => {
      const res = await getKpis(cookies.director, {
        weekStart: week,
        territoryId: ids.zoneB,
      }).expect(200);

      expect(res.body).toMatchObject({
        territoryId: ids.zoneA,
        scheduledVisits: 4,
      });
    });
  });

  describe('KPIs', () => {
    it('returns the exact KPIs of territory A and matches independent SQL', async () => {
      const res = await getKpis(cookies.admin, {
        weekStart: week,
        territoryId: ids.zoneA,
      }).expect(200);

      expect(res.body).toEqual({
        weekStart: '2025-03-03',
        weekEnd: '2025-03-09',
        territoryId: ids.zoneA,
        scheduledVisits: 4,
        completedVisits: 2,
        effectiveness: 50,
        quotedAmount: '3000.36',
        closedOrders: 2,
        revenue: null,
      });
      expect(res.body).toMatchObject(await expectedFromSql(ids.zoneA));
    });

    it('returns the KPIs of territory B', async () => {
      const res = await getKpis(cookies.admin, {
        weekStart: week,
        territoryId: ids.zoneB,
      }).expect(200);

      expect(res.body).toMatchObject({
        scheduledVisits: 2,
        completedVisits: 1,
        effectiveness: 50,
        quotedAmount: '500.50',
        closedOrders: 1,
      });
      expect(res.body).toMatchObject(await expectedFromSql(ids.zoneB));
    });

    it('aggregates every territory without a filter', async () => {
      const res = await getKpis(cookies.admin, { weekStart: week }).expect(200);

      expect(res.body.territoryId).toBeNull();
      expect(res.body).toMatchObject(await expectedFromSql());
      expect(res.body.scheduledVisits).toBeGreaterThanOrEqual(6);
    });

    it('gives a director their own territory by default', async () => {
      const res = await getKpis(cookies.director, { weekStart: week }).expect(
        200,
      );

      expect(res.body).toMatchObject({
        territoryId: ids.zoneA,
        scheduledVisits: 4,
        quotedAmount: '3000.36',
      });
    });

    it('returns zeros and null effectiveness for an empty week', async () => {
      const res = await getKpis(cookies.admin, {
        weekStart: '2001-01-01',
        territoryId: ids.zoneA,
      }).expect(200);

      expect(res.body).toMatchObject({
        scheduledVisits: 0,
        completedVisits: 0,
        effectiveness: null,
        quotedAmount: '0.00',
        closedOrders: 0,
        revenue: null,
      });
    });

    it('defaults to the current week (a Monday)', async () => {
      const res = await getKpis(cookies.admin, {}).expect(200);

      expect(new Date(`${res.body.weekStart}T00:00:00Z`).getUTCDay()).toBe(1);
    });

    it('turns any day into the Monday–Sunday week that contains it', async () => {
      const sunday = await getKpis(cookies.admin, {
        weekStart: '2025-03-09',
        territoryId: ids.zoneA,
      }).expect(200);

      expect(sunday.body).toMatchObject({
        weekStart: '2025-03-03',
        weekEnd: '2025-03-09',
        scheduledVisits: 4,
      });
    });

    it('returns zeros for a territory that does not exist', async () => {
      const res = await getKpis(cookies.admin, {
        weekStart: week,
        territoryId: 999999,
      }).expect(200);

      expect(res.body).toMatchObject({ scheduledVisits: 0, closedOrders: 0 });
    });
  });

  describe('filter validation', () => {
    it.each([
      [{ weekStart: '03/03/2025' }],
      [{ weekStart: '2025-02-30' }],
      [{ weekStart: '2025-03-03', territoryId: 'abc' }],
      [{ weekStart: '2025-03-03', territoryId: 0 }],
    ])('%o -> 400', async (query) => {
      const res = await getKpis(cookies.admin, query).expect(400);

      expect(res.body).toHaveProperty('message');
    });
  });
});
