import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DataSource } from 'typeorm';

/**
 * Standalone DataSource for the TypeORM CLI (migration:generate/run/revert)
 * and for Better Auth's typeormAdapter (auth.ts). Separate from the runtime
 * connection in app.module.ts because the CLI runs outside Nest's DI and
 * ConfigModule — run it via `npm run typeorm`, which loads .env with Node's
 * --env-file flag before this file executes.
 *
 * Entities/migrations are globbed relative to this file's own directory
 * (not a hardcoded 'src/...' string) with a {.ts,.js} extension so the same
 * glob resolves correctly in both places this DataSource actually runs:
 * - CLI, via `tsx` against the .ts sources directly (this file at
 *   src/shared/config/data-source.ts).
 * - The live app (imported by auth.ts into a NestJS provider), running
 *   compiled output where this file is dist/shared/config/data-source.js —
 *   a literal '.ts' glob here would make TypeORM dynamic-import raw
 *   TypeScript source into plain Node, which can't parse it
 *   ("SyntaxError: Invalid or unexpected token" from the ESM loader).
 *
 * Don't replace the glob with an explicit per-module import list either —
 * it silently drops whichever module's migrations you forget to add.
 */
const currentDir = dirname(fileURLToPath(import.meta.url));

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT ?? '', 10) || 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: false,
  entities: [
    join(currentDir, '../../modules/**/infrastructure/*.orm-entity{.ts,.js}'),
  ],
  migrations: [
    join(currentDir, '../../modules/**/infrastructure/migrations/*{.ts,.js}'),
  ],
});

export default dataSource;
