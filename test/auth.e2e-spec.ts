import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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

  describe('1. Registro e inicio de sesión', () => {
    it('debe registrar un nuevo usuario con éxito', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.role).toBe('ASESOR');
    });

    it('debe rechazar credenciales incorrectas con status 401 y mensaje de error', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/incorrect|invalid|credenciales/i);
    });

    it('debe iniciar sesión con credenciales correctas y rememberMe=true (cookie persistente con Max-Age)', async () => {
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

      const setCookieHeaders = response.headers['set-cookie'];
      expect(setCookieHeaders).toBeDefined();

      const sessionCookie = (setCookieHeaders as string[]).find((c: string) =>
        c.includes('better-auth.session_token='),
      );
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toMatch(/Max-Age=/i);
    });

    it('debe iniciar sesión con credenciales correctas y rememberMe=false (cookie de sesión sin Max-Age)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          rememberMe: false,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');

      const setCookieHeaders = response.headers['set-cookie'];
      expect(setCookieHeaders).toBeDefined();

      const sessionCookie = (setCookieHeaders as string[]).find((c: string) =>
        c.includes('better-auth.session_token='),
      );
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).not.toMatch(/Max-Age=/i);
    });
  });

  describe('2. Guard de sesión en backend (endpoints protegidos)', () => {
    it('un endpoint protegido sin sesión debe devolver 401 Unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('el endpoint /auth/protected sin sesión debe devolver 401 Unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/protected')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('con sesión iniciada, debe acceder al endpoint protegido con 200', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          rememberMe: true,
        })
        .expect(200);

      const setCookieHeaders = loginRes.headers['set-cookie'];
      const sessionTokenCookie = (setCookieHeaders as string[])
        .find((c: string) => c.includes('better-auth.session_token='))
        ?.split(';')[0];

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

      expect(protectedRes.body).toHaveProperty('message', 'Acceso autorizado');
      expect(protectedRes.body.user.email).toBe(testUser.email);
    });
  });

  describe('3. Logout e invalidación de sesión', () => {
    it('al cerrar sesión, la sesión se invalida y los endpoints protegidos devuelven 401', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          rememberMe: true,
        })
        .expect(200);

      const setCookieHeaders = loginRes.headers['set-cookie'];
      const sessionTokenCookie = (setCookieHeaders as string[])
        .find((c: string) => c.includes('better-auth.session_token='))
        ?.split(';')[0];

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

  describe('4. Compatibilidad con endpoints nativos de Better Auth (/api/auth/*)', () => {
    it('debe permitir iniciar sesión a través del endpoint nativo /api/auth/sign-in/email', async () => {
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
