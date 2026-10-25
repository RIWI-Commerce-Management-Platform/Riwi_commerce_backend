import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderOrmEntity } from './infrastructure/order.orm-entity.js';
import { OrderItemOrmEntity } from './infrastructure/order-item.orm-entity.js';
import { OrderDao } from './domain/order.dao.js';
import { TypeOrmOrderDao } from './infrastructure/typeorm-order.dao.js';
import { ConvertQuoteToOrderUseCase } from './application/convert-quote-to-order.use-case.js';
import { GetOrderByIdUseCase } from './application/get-order-by-id.use-case.js';
import { ChangeOrderStatusUseCase } from './application/change-order-status.use-case.js';
import { ListOrdersUseCase } from './application/list-orders.use-case.js';
import { OrdersController } from './presentation/orders.controller.js';
import { OrdersConversionController } from './presentation/orders-conversion.controller.js';
import { QuotesModule } from '../quotes/quotes.module.js';
import { ActivityLogModule } from '../../shared/activity-log/activity-log.module.js';
import { AuthModule } from '../../shared/auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderOrmEntity, OrderItemOrmEntity]),
    QuotesModule,
    ActivityLogModule,
    AuthModule,
  ],
  controllers: [OrdersController, OrdersConversionController],
  providers: [
    ConvertQuoteToOrderUseCase,
    GetOrderByIdUseCase,
    ChangeOrderStatusUseCase,
    ListOrdersUseCase,
    { provide: OrderDao, useClass: TypeOrmOrderDao },
  ],
  exports: [
    OrderDao,
    ConvertQuoteToOrderUseCase,
    GetOrderByIdUseCase,
    ChangeOrderStatusUseCase,
    ListOrdersUseCase,
  ],
})
export class OrdersModule {}
