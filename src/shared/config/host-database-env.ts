import { existsSync } from 'node:fs';

/**
 * Preloaded (`node --import`) by `seed:demo` and the TypeORM CLI scripts,
 * before anything reads the environment. `.env` is shared with docker
 * compose, where the database is reached as `db`. Those scripts usually run
 * on the host, where compose publishes the same port on `localhost`, so the
 * host is rewritten there and `.env` keeps working for `docker compose up`.
 * Inside a container (the Dockerfile runs `migration:run`) `db` is right and
 * nothing changes.
 */
if (process.env.POSTGRES_HOST === 'db' && !existsSync('/.dockerenv')) {
  process.env.POSTGRES_HOST = 'localhost';
}

export {};
