import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });
  const config = new DocumentBuilder()
    .setTitle('RIWI Commerce')
    .setDescription('RIwi Commerce Management Platform')
    .setVersion('1.0')
    .addTag('Commerce API')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  console.log(`App is running in port http://localhost:${port}`);
  console.log(`Suagger is running in port http://localhost:${port}/docs`);
}
await bootstrap();
