import { readFileSync } from 'node:fs';

export type DatabaseSsl = false | { rejectUnauthorized: true; ca?: string };

/**
 * TLS settings shared by the three Postgres connections (TypeORM runtime,
 * TypeORM CLI and Better Auth's `pg` Pool). Amazon RDS for PostgreSQL 15+
 * rejects unencrypted connections (`rds.force_ssl=1`), so production sets
 * POSTGRES_SSL=true and POSTGRES_SSL_CA to the RDS CA bundle
 * (https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem).
 * The certificate is always verified. Local docker compose leaves it off.
 */
export function databaseSsl(env: NodeJS.ProcessEnv = process.env): DatabaseSsl {
  if (env.POSTGRES_SSL !== 'true') return false;
  const caPath = env.POSTGRES_SSL_CA;
  return caPath
    ? { rejectUnauthorized: true, ca: readFileSync(caPath, 'utf8') }
    : { rejectUnauthorized: true };
}
