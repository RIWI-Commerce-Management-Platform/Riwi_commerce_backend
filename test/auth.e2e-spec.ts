import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

const findSessionCookie = (headers: unknown): string | undefined => {
  const cookieHeaders = Array.isArray(headers) ? headers : [headers];
  return cookieHeaders.find(
    (header): header is string =>
      typeof header === 'string' &&
      header.includes('better-auth.session_token='),
  );
};

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

  describe('1. Registration and sign-in', () => {
    it('should successfully register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.role).toBe('ASESOR');
    });

    it('should reject incorrect credentials with status 401 and an error message', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/incorrect|invalid/i);
    });

    it('should sign in with rememberMe=true and set a persistent cookie with Max-Age', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          rememberMe: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);

      const sessionCookie = findSessionCookie(response.headers['set-cookie']);
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toMatch(/Max-Age=/i);
    });

    it('should sign in with rememberMe=false and set a session cookie without Max-Age', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          rememberMe: false,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');

      const sessionCookie = findSessionCookie(response.headers['set-cookie']);
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).not.toMatch(/Max-Age=/i);
    });
  });

  describe('2. Backend session guard (protected endpoints)', () => {
    it('should return 401 Unauthorized for a protected endpoint without a session', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should return 401 Unauthorized for /auth/protected without a session', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/protected')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should access the protected endpoint with status 200 when signed in', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          rememberMe: true,
        })
        .expect(200);

      const sessionTokenCookie = findSessionCookie(
        loginRes.headers['set-cookie'],
      )?.split(';')[0];

      const meRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', sessionTokenCookie || '')
        .expect(200);

      expect(meRes.body).toHaveProperty('user');
      expect(meRes.body.user.email).toBe(testUser.email);
      expect(meRes.body).toHaveProperty('session');

      const protectedRes = await request(app.getHttpServer())
        .get('/auth/protected')
        .set('Cookie', sessionTokenCookie || '')
        .expect(200);

      expect(protectedRes.body).toHaveProperty('message', 'Access granted');
      expect(protectedRes.body.user.email).toBe(testUser.email);
    });
  });

  describe('3. Sign-out and session invalidation', () => {
    it('should invalidate the session on sign-out and return 401 for protected endpoints', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          rememberMe: true,
        })
        .expect(200);

      const sessionTokenCookie = findSessionCookie(
        loginRes.headers['set-cookie'],
      )?.split(';')[0];

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', sessionTokenCookie || '')
        .expect(200);

      const logoutRes = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', sessionTokenCookie || '')
        .expect(200);

      expect(logoutRes.body).toHaveProperty('success', true);

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', sessionTokenCookie || '')
        .expect(401);
    });
  });

  describe('4. Better Auth native endpoint compatibility (/api/auth/*)', () => {
    it('should allow sign-in through the native /api/auth/sign-in/email endpoint', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: testUser.email,
          password: testUser.password,
          rememberMe: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });
});
