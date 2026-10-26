import { databaseSsl } from './database-ssl.js';

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
    ssl: databaseSsl(),
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  },
  aws: {
    region: process.env.AWS_REGION ?? 'us-east-1',
    bucketName: process.env.AWS_S3_BUCKET ?? 'comercial-360-bucket',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  betterAuth: {
    secret: process.env.BETTER_AUTH_SECRET,
    url:
      process.env.BETTER_AUTH_URL ??
      `http://localhost:${process.env.PORT ?? 3000}`,
  },
});
