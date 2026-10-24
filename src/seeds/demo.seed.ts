import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module.js';
import { auth } from '../modules/auth/auth.js';
import { UserRole } from '../modules/auth/domain/user-role.enum.js';
import { AssignUserRoleUseCase } from '../modules/auth/application/assign-user-role.use-case.js';
import { CreateAdvisorUseCase } from '../modules/advisors/application/create-advisor.use-case.js';
import { CreateClientUseCase } from '../modules/clients/application/create-client.use-case.js';
import { CreateClientContactUseCase } from '../modules/clients/application/create-client-contact.use-case.js';
import { AddClientPortfolioUseCase } from '../modules/clients/application/add-client-portfolio.use-case.js';
import { CreateRouteDraftUseCase } from '../modules/routes/application/create-route-draft.use-case.js';
import { AddRouteStopUseCase } from '../modules/routes/application/add-route-stop.use-case.js';
import { AssignRouteAdvisorUseCase } from '../modules/routes/application/assign-route-advisor.use-case.js';
import { DayOfWeek } from '../modules/routes/domain/day-of-week.enum.js';
import { RouteFrequency } from '../modules/routes/domain/route-frequency.enum.js';
import { StartVisitUseCase } from '../modules/visit/application/use-cases/start-visit.use-case.js';
import { RegisterVisitResultUseCase } from '../modules/visit/application/use-cases/register-visit-result.use-case.js';
import { RegisterCommercialOutcomeUseCase } from '../modules/visit/application/use-cases/register-commercial-outcome.use-case.js';
import { CreateFollowUpUseCase } from '../modules/visit/application/use-cases/create-follow-up.use-case.js';
import { CreateQuoteUseCase } from '../modules/quotes/application/create-quote.use-case.js';
import { ChangeQuoteStatusUseCase } from '../modules/quotes/application/change-quote-status.use-case.js';
import { QuoteStatus } from '../modules/quotes/domain/quote-status.enum.js';
import { ConvertQuoteToOrderUseCase } from '../modules/orders/application/convert-quote-to-order.use-case.js';
import {
  DEMO_ADMIN,
  DEMO_ADVISORS,
  DEMO_CLIENTS,
  DEMO_DIRECTOR,
  DEMO_PRODUCTS,
  DEMO_ROUTES,
} from './demo-data.js';

/**
 * HU-42: loads the demo data through the real use cases, so it also
 * exercises the whole flow (users -> clients -> routes -> visits -> quotes
 * -> orders -> follow-ups). Run with `npm run seed:demo` after the
 * migrations. The password of every demo user comes from DEMO_PASSWORD and
 * is never stored in the repository. Running it twice does nothing.
 */
async function seed(): Promise<void> {
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error('Set DEMO_PASSWORD (8+ characters) to run the demo seed.');
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const get = <T>(type: new (...args: any[]) => T): T =>
    app.get(type, { strict: false });

  try {
    const db = app.get(DataSource);
    const [existing] = await db.query(
      'SELECT id FROM "user" WHERE email = $1',
      [DEMO_ADMIN.email],
    );
    if (existing) {
      console.warn('Demo data is already loaded; nothing to do.');
      return;
    }

    const idsByName = async (table: string) =>
      new Map<string, number>(
        (await db.query(`SELECT id, name FROM ${table}`)).map(
          (row: { id: number; name: string }) => [row.name, Number(row.id)],
        ),
      );
    const zones = await idsByName('zones');
    const [clientTypeId] = (await idsByName('client_types')).values();
    const potentials = [...(await idsByName('potentials')).values()];
    const [clientStatusId] = (await idsByName('client_statuses')).values();
    const portfolios = [...(await idsByName('portfolios')).values()];
    const visitResults = [...(await idsByName('visit_results')).values()];
    const zoneId = (name: string) => {
      const id = zones.get(name);
      if (!id)
        throw new Error(`Zone "${name}" is missing; seed the catalogs first.`);
      return id;
    };

    // Users
    const signUp = async (name: string, email: string) =>
      Number(
        (await auth.api.signUpEmail({ body: { name, email, password } })).user
          .id,
      );
    const assignRole = get(AssignUserRoleUseCase);

    const adminId = await signUp(DEMO_ADMIN.name, DEMO_ADMIN.email);
    await assignRole.execute({ userId: adminId, role: UserRole.ADMIN });
    const directorId = await signUp(DEMO_DIRECTOR.name, DEMO_DIRECTOR.email);
    await assignRole.execute({
      userId: directorId,
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: zoneId(DEMO_DIRECTOR.zone),
    });
    await db.query('DELETE FROM "session" WHERE "userId" = ANY($1)', [
      [adminId, directorId],
    ]);

    const advisorIds: number[] = [];
    for (const advisor of DEMO_ADVISORS) {
      const created = await get(CreateAdvisorUseCase).execute({
        name: advisor.name,
        email: advisor.email,
        password,
        phone: advisor.phone,
        documentNumber: advisor.documentNumber,
        zoneId: zoneId(advisor.zone),
        weeklyVisitGoal: advisor.weeklyVisitGoal,
      });
      advisorIds.push(created.userId);
    }
    console.log(`Users: 1 admin, 1 director, ${advisorIds.length} advisors`);

    // Clients with their primary contact and portfolios
    const clientIdsByZone = new Map<string, number[]>();
    for (const [index, demo] of DEMO_CLIENTS.entries()) {
      const created = await get(CreateClientUseCase).execute({
        nit: demo.nit,
        businessName: demo.businessName,
        commercialName: demo.commercialName,
        address: demo.address,
        department: 'Atlantico',
        municipality: demo.municipality,
        neighborhood: demo.neighborhood,
        phone: '+576053850000',
        email: `compras${index + 1}@demo-client.co`,
        zoneId: zoneId(demo.zone),
        clientTypeId,
        potentialId: potentials[index % potentials.length],
        clientStatusId,
        visitFrequencyDays: 7,
        latitude: demo.latitude,
        longitude: demo.longitude,
        actorId: adminId,
      });
      await get(CreateClientContactUseCase).execute({
        clientId: created.id!,
        name: demo.contact.name,
        position: demo.contact.position,
        phone: '+576053850000',
        mobile: demo.contact.mobile,
        email: `contact${index + 1}@demo-client.co`,
        isPrimary: true,
        actorId: adminId,
      });
      for (const portfolioId of portfolios.slice(index % 2, (index % 2) + 2)) {
        await get(AddClientPortfolioUseCase).execute({
          clientId: created.id!,
          portfolioId,
          actorId: adminId,
        });
      }
      clientIdsByZone.set(demo.zone, [
        ...(clientIdsByZone.get(demo.zone) ?? []),
        created.id!,
      ]);
    }
    console.log(`Clients: ${DEMO_CLIENTS.length} with contacts and portfolios`);

    // Routes starting this week, assigned so the visits are scheduled
    const admin = { id: adminId, role: UserRole.ADMIN, zoneId: null };
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    for (const demoRoute of DEMO_ROUTES) {
      const route = await get(CreateRouteDraftUseCase).execute(
        {
          name: demoRoute.name,
          description: `Demo route for ${demoRoute.zone}`,
          zoneId: zoneId(demoRoute.zone),
          dayOfWeek: DayOfWeek[demoRoute.dayOfWeek],
          frequency: RouteFrequency.WEEKLY,
          startTime: '08:00:00',
          endTime: '12:00:00',
          startDate: monday,
        },
        admin,
      );
      for (const [index, clientId] of (
        clientIdsByZone.get(demoRoute.zone) ?? []
      ).entries()) {
        const hour = String(8 + index).padStart(2, '0');
        await get(AddRouteStopUseCase).execute(
          route.id!,
          {
            clientId,
            suggestedTime: `${hour}:00:00`,
            estimatedDurationMinutes: 40,
          },
          admin,
        );
      }
      await get(AssignRouteAdvisorUseCase).execute(
        route.id!,
        advisorIds[demoRoute.advisor],
        admin,
      );
    }
    console.log(`Routes: ${DEMO_ROUTES.length}, assigned with their visits`);

    // Visits already done, with quotes, orders and follow-ups
    const visits: { id: number; client_id: number; advisor_id: number }[] =
      await db.query(
        // The two earliest past visits of each advisor
        `SELECT id, client_id, advisor_id FROM (
           SELECT id, client_id, advisor_id, scheduled_at,
                  row_number() OVER (PARTITION BY advisor_id ORDER BY scheduled_at) AS n
             FROM visits
            WHERE scheduled_at < now() AND status = 'PENDING'
         ) ranked
          WHERE n <= 2
          ORDER BY scheduled_at`,
      );
    for (const [index, visit] of visits.entries()) {
      await get(StartVisitUseCase).execute(visit.id, visit.advisor_id);
      await get(RegisterVisitResultUseCase).execute(
        visit.id,
        visit.advisor_id,
        {
          endTime: '23:59:00',
          observations: 'Demo visit: the client reviewed the new price list.',
          results: [{ id: visitResults[index % visitResults.length] }],
        },
      );
      if (index % 2 === 1) {
        continue;
      }

      await get(RegisterCommercialOutcomeUseCase).execute(
        visit.id,
        visit.advisor_id,
        { quoteGenerated: true, orderGenerated: index === 0 },
      );
      const quote = await get(CreateQuoteUseCase).execute({
        clientId: visit.client_id,
        advisorId: visit.advisor_id,
        visitId: visit.id,
        notes: 'Demo quote generated during the visit',
        items: DEMO_PRODUCTS.slice(0, 2 + (index % 3)).map((product, i) => ({
          ...product,
          quantity: 2 + i,
        })),
      });
      await get(ChangeQuoteStatusUseCase).execute({
        quoteId: quote.id!,
        newStatus: QuoteStatus.SENT,
        actorId: visit.advisor_id,
      });
      if (index === 0) {
        await get(ChangeQuoteStatusUseCase).execute({
          quoteId: quote.id!,
          newStatus: QuoteStatus.APPROVED,
          actorId: visit.advisor_id,
        });
        await get(ConvertQuoteToOrderUseCase).execute({
          quoteId: quote.id!,
          actorId: visit.advisor_id,
        });
      }
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 2);
      await get(CreateFollowUpUseCase).execute(visit.id, visit.advisor_id, {
        dueDate,
        activity: 'Call to confirm the quote',
      });
    }
    console.log(
      `Visits done: ${visits.length}, with quotes, an order and follow-ups`,
    );
    console.log(
      `Done. Sign in as ${DEMO_ADMIN.email}, ${DEMO_DIRECTOR.email} or any advisor with DEMO_PASSWORD.`,
    );
  } finally {
    await app.close();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
