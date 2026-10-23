import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VisitsModule } from './modules/visit/visit.module.js';
import configuration from './shared/config/configuration.js';
import { ZonesModule } from './modules/zones/zones.module.js';
import { FileStorageModule } from './shared/file-storage/file-storage.module.js';
import { QuotesModule } from './modules/quotes/quotes.module.js';
import { ClientsModule } from './modules/clients/clients.module.js';
import { CatalogsModule } from './modules/catalogs/catalogs.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { RoutesModule } from './modules/routes/routes.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    /**
     * This will be commited for the momment.
     */
    // ObserveModule.forRoot({
    //   appKey: 'YOUR_APP_KEY',
    //   appSecret: 'YOUR_APP_SECRET',
    //   serviceId: 'Riwi_commerce_backend',
    // }),
    VisitsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    ZonesModule,
    ClientsModule,
    CatalogsModule,
    FileStorageModule,
    QuotesModule,
    AuthModule,
    RoutesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
