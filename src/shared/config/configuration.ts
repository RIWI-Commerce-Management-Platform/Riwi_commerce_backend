/**
 * Centralized application configuration, read from environment variables.
 */
export default () => ({
  port: parseInt(process.env.PORT ?? '', 10) || 3000,
  database: {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '', 10) || 5432,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    name: process.env.POSTGRES_DB,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTtlSeconds:
      parseInt(process.env.JWT_ACCESS_TTL_SECONDS ?? '', 10) || 900,
    refreshTtlSeconds:
      parseInt(process.env.JWT_REFRESH_TTL_SECONDS ?? '', 10) || 604800,
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
});
