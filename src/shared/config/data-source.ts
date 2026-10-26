import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DataSource } from 'typeorm';
import { databaseSsl } from './database-ssl.js';

/**
 * Standalone DataSource for the TypeORM CLI (migration:generate/run/revert).
 * Separate from the runtime connection in app.module.ts because the CLI runs
 * outside Nest's DI and ConfigModule — run it via `npm run typeorm`, which
 * loads .env with Node's --env-file flag before this file executes.
 *
 * Entities/migrations are globbed relative to this file's own directory
 * (not a hardcoded 'src/...' string) with a {.ts,.js} extension, so the glob
 * resolves both when the CLI runs the .ts sources through `tsx` and if this
 * file is ever loaded from compiled output in dist/. A literal '.ts' glob
 * there would make TypeORM dynamic-import raw TypeScript into plain Node
 * ("SyntaxError: Invalid or unexpected token" from the ESM loader).
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
  ssl: databaseSsl(),
  synchronize: false,
  entities: [
    join(currentDir, '../../modules/**/infrastructure/*.orm-entity{.ts,.js}'),
  ],
  migrations: [
    join(currentDir, '../../modules/**/infrastructure/migrations/*{.ts,.js}'),
  ],
});

export default dataSource;
