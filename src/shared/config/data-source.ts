import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { UserOrmEntity } from '../../modules/auth/infrastructure/user.orm-entity.js';
import { SessionOrmEntity } from '../../modules/auth/infrastructure/session.orm-entity.js';
import { AccountOrmEntity } from '../../modules/auth/infrastructure/account.orm-entity.js';
import { VerificationOrmEntity } from '../../modules/auth/infrastructure/verification.orm-entity.js';
import { ZoneOrmEntity } from '../../modules/zones/infrastructure/zone.orm-entity.js';
import { ClientOrmEntity } from '../../modules/client/infrastructure/client.orm-entity.js';
import { CreateZonesTable1792430815281 } from '../../modules/zones/infrastructure/migrations/1792430815281-CreateZonesTable.js';
import { CreateAuthTables1792598977478 } from '../../modules/auth/infrastructure/migrations/1792598977478-CreateAuthTables.js';

/**
 * Standalone DataSource for the TypeORM CLI (migration:generate/run/revert)
 * and for Better Auth's typeormAdapter.
 */
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT ?? '', 10) || 5432,
  username: process.env.POSTGRES_USER ?? 'test',
  password: process.env.POSTGRES_PASSWORD ?? 'test',
  database: process.env.POSTGRES_DB ?? 'commerce_db',
  synchronize: false,
  entities: [
    UserOrmEntity,
    SessionOrmEntity,
    AccountOrmEntity,
    VerificationOrmEntity,
    ZoneOrmEntity,
    ClientOrmEntity,
  ],
  migrations: [CreateZonesTable1792430815281, CreateAuthTables1792598977478],
});

export default dataSource;
