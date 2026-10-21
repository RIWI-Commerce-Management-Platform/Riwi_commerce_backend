import 'reflect-metadata';
import { DataSource } from 'typeorm';

/**
 * Standalone DataSource for the TypeORM CLI (migration:generate/run/revert).
 * Separate from the runtime connection in app.module.ts because the CLI runs
 * outside Nest's DI and ConfigModule — run it via `npm run typeorm`, which
 * loads .env with Node's --env-file flag before this file executes.
 */
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT ?? '', 10) || 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: false,
  entities: ['src/modules/**/infrastructure/*.orm-entity.ts'],
  migrations: ['src/modules/**/infrastructure/migrations/*.ts'],
});

export default dataSource;

