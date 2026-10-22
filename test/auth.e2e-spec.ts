import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { AuthService } from '../src/modules/auth/application/auth.service.js';
import { UserOrmEntity } from '../src/modules/auth/infrastructure/user.orm-entity.js';
import { AdvisorOrmEntity } from '../src/modules/advisors/infrastructure/advisor.orm-entity.js';
import { UserRole } from '../src/modules/auth/domain/user-role.enum.js';
import dataSource from '../src/shared/config/data-source.js';

describe('Auth Module (e2e)', () => {
  let app: INestApplication<App>;
  const randomSuffix = Math.random().toString(36).substring(7);
  const testUser = {
    name: 'Test Authentication User',
    email: `test_user_${Date.now()}_${randomSuffix}@riwi.com`,
    password: 'Password123!',
  };
  const adminUser = {
    name: 'Initial Test Administrator',
    email: `test_admin_${Date.now()}_${randomSuffix}@riwi.com`,
    password: `Admin-${randomSuffix}-Password-123!`,
  };
  let adminAuthorization: string;

  beforeAll(async () => {
    process.env.INITIAL_ADMIN_EMAIL = adminUser.email;
    process.env.INITIAL_ADMIN_PASSWORD = adminUser.password;
    process.env.INITIAL_ADMIN_NAME = adminUser.name;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    await dataSource.runMigrations();
    app = moduleFixture.createNestApplication();
    await app.init();

    const advisors = app.get<Repository<AdvisorOrmEntity>>(
      getRepositoryToken(AdvisorOrmEntity),
    );
    await advisors.save(
      advisors.create({
        nombre: 'Test Authentication User',
        correo: testUser.email,
        telefono: '3001234567',
        estado: true,
        idUsuario: null,
      }),
    );
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminUser.email, password: adminUser.password })
      .expect(200);
    adminAuthorization = `Bearer ${adminLogin.body.accessToken}`;
  });

  afterAll(async () => {
    if (app) {
      const advisors = app.get<Repository<AdvisorOrmEntity>>(
        getRepositoryToken(AdvisorOrmEntity),
      );
      const users = app.get<Repository<UserOrmEntity>>(
        getRepositoryToken(UserOrmEntity),
      );
      const authService = app.get(AuthService);
      await advisors.delete({ correo: testUser.email });
      const testAccount = await users.findOneBy({ email: testUser.email });
      if (testAccount) {
        await authService.revokeAllSessions(testAccount.id);
        await users.delete({ id: testAccount.id });
      }
      const adminAccount = await users.findOneBy({ email: adminUser.email });
      if (adminAccount) {
        await authService.revokeAllSessions(adminAccount.id);
        await users.delete({ id: adminAccount.id });
      }
    }
    await app.close();
    delete process.env.INITIAL_ADMIN_EMAIL;
    delete process.env.INITIAL_ADMIN_PASSWORD;
    delete process.env.INITIAL_ADMIN_NAME;
  });

  it('registers and links a user to the matching advisor profile', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .set('Authorization', adminAuthorization)
      .send(testUser)
      .expect(201);

    expect(response.body.user.email).toBe(testUser.email);
    expect(response.body.user.role).toBe('ASESOR');
    const advisor = await app
      .get<Repository<AdvisorOrmEntity>>(
        getRepositoryToken(AdvisorOrmEntity),
      )
      .findOneBy({ correo: testUser.email });
    expect(advisor?.idUsuario).toBe(response.body.user.id);
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('rejects incorrect credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword!' })
      .expect(401);

    expect(response.body.message).toMatch(/incorrect email or password/i);
  });

  it('signs in and returns bearer tokens', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(testUser)
      .expect(200);

    expect(response.body.user.email).toBe(testUser.email);
    expect(response.body.tokenType).toBe('Bearer');
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('rotates refresh tokens and rejects reuse of the old token', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send(testUser)
      .expect(200);

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(200);

    expect(refreshed.body.accessToken).toEqual(expect.any(String));
    expect(refreshed.body.refreshToken).not.toBe(login.body.refreshToken);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
  });

  it('requires a bearer token for protected endpoints', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
    await request(app.getHttpServer()).get('/auth/protected').expect(401);
  });

  it('exposes the authenticated user and session to protected endpoints', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send(testUser)
      .expect(200);
    const authorization = `Bearer ${login.body.accessToken}`;

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', authorization)
      .expect(200);

    expect(me.body.user.email).toBe(testUser.email);
    expect(me.body.user.role).toBe(UserRole.ASESOR);
    expect(me.body.session.id).toEqual(expect.any(String));

    const protectedResponse = await request(app.getHttpServer())
      .get('/auth/protected')
      .set('Authorization', authorization)
      .expect(200);
    expect(protectedResponse.body.message).toBe('Access granted');
  });

  it('revokes the current session on logout', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send(testUser)
      .expect(200);
    const authorization = `Bearer ${login.body.accessToken}`;

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', authorization)
      .expect(200);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', authorization)
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
  });

  it('serves the Better Auth session endpoint', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/get-session')
      .expect(200)
      .expect((response) => {
        expect(response.body).toBeNull();
      });
  });
});
