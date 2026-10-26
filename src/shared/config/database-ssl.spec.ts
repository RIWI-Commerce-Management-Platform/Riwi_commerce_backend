import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { databaseSsl } from './database-ssl.js';

describe('databaseSsl', () => {
  it('is off unless POSTGRES_SSL is "true"', () => {
    expect(databaseSsl({})).toBe(false);
    expect(databaseSsl({ POSTGRES_SSL: 'false' })).toBe(false);
  });

  it('verifies the certificate against the system CAs when no bundle is set', () => {
    expect(databaseSsl({ POSTGRES_SSL: 'true' })).toEqual({
      rejectUnauthorized: true,
    });
  });

  it('loads the CA bundle from POSTGRES_SSL_CA', () => {
    const caPath = join(mkdtempSync(join(tmpdir(), 'ssl-')), 'bundle.pem');
    writeFileSync(caPath, 'CERT');

    expect(
      databaseSsl({ POSTGRES_SSL: 'true', POSTGRES_SSL_CA: caPath }),
    ).toEqual({ rejectUnauthorized: true, ca: 'CERT' });
  });

  it('fails fast when the CA bundle is missing', () => {
    expect(() =>
      databaseSsl({ POSTGRES_SSL: 'true', POSTGRES_SSL_CA: '/nope.pem' }),
    ).toThrow();
  });
});
