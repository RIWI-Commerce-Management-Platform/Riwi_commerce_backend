/**
 * Preloaded by `npm run seed:demo` (`node --import`) before the seed and its
 * imports read the environment. The seed runs on the host, but `.env` is
 * shared with docker compose, where the database is reached as `db` on the
 * container port. From the host it is `localhost` on the published port
 * (POSTGRES_HOST_PORT), so the seed rewrites both here and `.env` keeps
 * working for `docker compose up`.
 */
if (process.env.POSTGRES_HOST === 'db') {
  process.env.POSTGRES_HOST = 'localhost';
  process.env.POSTGRES_PORT =
    process.env.POSTGRES_HOST_PORT ?? process.env.POSTGRES_PORT;
}

export {};
