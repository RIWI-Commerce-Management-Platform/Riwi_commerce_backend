import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientOrmEntity } from './infrastructure/client.orm-entity.js';


@Module({
  imports: [TypeOrmModule.forFeature([ClientOrmEntity])],
  controllers: [],
})
export class ZonesModule {}
