import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

describe('Auth Module (e2e)', () => {
  let app: INestApplication<App>;
  const randomSuffix = Math.random().toString(36).substring(7);
  const testUser = {
    name: 'Test Authentication User',
    email: `test_user_${Date.now()}_${randomSuffix}@riwi.com`,
    password: 'Password123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a user and returns bearer access and refresh tokens', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    expect(response.body.user.email).toBe(testUser.email);
    expect(response.body.user.role).toBe('ASESOR');
    expect(response.body.tokenType).toBe('Bearer');
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
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
    expect(me.body.user.role).toBe('ASESOR');
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
