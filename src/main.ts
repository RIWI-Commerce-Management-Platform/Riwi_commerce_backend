import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule, ObserveInstrument } from './app.module.js';
import { AllExceptionsFilter } from './shared/http/all-exceptions.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // HU-04: shared validation and error format for every module.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('RIWI Commerce')
    .setDescription('RIwi Commerce Management Platform')
    .setVersion('1.0')
    .addTag('Commerce API')
    .addTag('Clients', 'Client management endpoints')
    .addTag('Client Contacts', 'Client contacts management')
    .addTag('Catalogs', 'System parameter catalogs and seed')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  // `/docs` locally; `/api/docs` is the URL the spec asks for and the one
  // that works behind the Nginx `/api` proxy.
  SwaggerModule.setup('docs', app, documentFactory);
  SwaggerModule.setup('api/docs', app, documentFactory);

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  console.log(`App is running on http://localhost:${port}`);
  console.log(`Swagger is running on http://localhost:${port}/docs`);
}
await bootstrap();
