import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ConvertQuoteToOrderUseCase } from '../application/convert-quote-to-order.use-case.js';
import { CreateOrderFromVisitUseCase } from '../application/create-order-from-visit.use-case.js';
import { GetOrderByIdUseCase } from '../application/get-order-by-id.use-case.js';
import { ChangeOrderStatusUseCase } from '../application/change-order-status.use-case.js';
import { ListOrdersUseCase } from '../application/list-orders.use-case.js';
import { OrderResponseDto } from './dto/order-response.dto.js';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto.js';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto.js';
import { PaginatedResponseDto } from '../../../shared/pagination/paginated-response.dto.js';
import { OrderNotFoundError } from '../domain/errors/order-not-found.error.js';
import { QuoteNotApprovedForOrderError } from '../domain/errors/quote-not-approved-for-order.error.js';
import { QuoteAlreadyConvertedError } from '../domain/errors/quote-already-converted.error.js';
import { InvalidOrderStatusTransitionError } from '../domain/errors/invalid-order-status-transition.error.js';
import { QuoteNotFoundError } from '../../quotes/domain/errors/quote-not-found.error.js';
import { QuoteDoesNotBelongToVisitError } from '../domain/errors/quote-does-not-belong-to-visit.error.js';
import { CurrentAdvisorProvider } from '../../../shared/auth/domain/current-advisor.provider.js';
import { CreateOrderFromVisitDto } from './dto/create-order-from-visit.dto.js';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly convertQuoteToOrderUseCase: ConvertQuoteToOrderUseCase,
    private readonly createOrderFromVisitUseCase: CreateOrderFromVisitUseCase,
    private readonly getOrderByIdUseCase: GetOrderByIdUseCase,
    private readonly changeOrderStatusUseCase: ChangeOrderStatusUseCase,
    private readonly listOrdersUseCase: ListOrdersUseCase,
    private readonly currentAdvisor: CurrentAdvisorProvider,
  ) {}

  @Post('from-quote/:quoteId')
  @ApiOperation({
    summary: 'Convert an approved quote into an official order (HU-33)',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully with consecutive PED-0001',
    type: OrderResponseDto,
  })
  async createFromQuote(
    @Param('quoteId', ParseIntPipe) quoteId: number,
    @Req() request: Request,
  ): Promise<OrderResponseDto> {
    const actorId = await this.currentAdvisor.extract(request).catch(() => 1);

    try {
      const order = await this.convertQuoteToOrderUseCase.execute({
        quoteId,
        actorId,
      });
      return new OrderResponseDto(order);
    } catch (error) {
      if (error instanceof QuoteNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof QuoteNotApprovedForOrderError ||
        error instanceof QuoteAlreadyConvertedError
      ) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Post('from-visits/:visitId')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiParam({ name: 'visitId', description: 'Visit ID' })
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description:
      'Temporary advisor ID used by the existing visit identity adapter.',
    deprecated: true,
  })
  @ApiUnauthorizedResponse({
    description:
      'A valid Better Auth session and advisor identity are required.',
  })
  @ApiOperation({
    summary: 'Create an order from a quote for an advisor-owned visit (HU-27)',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created from the approved quote of the visit client.',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Quote is not approved, was already converted, or belongs to another client.',
  })
  @ApiResponse({ status: 404, description: 'Visit or quote not found.' })
  async createFromVisit(
    @Param('visitId', ParseIntPipe) visitId: number,
    @Req() request: Request,
    @Body() dto: CreateOrderFromVisitDto,
  ): Promise<OrderResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);

    try {
      const order = await this.createOrderFromVisitUseCase.execute({
        visitId,
        advisorId,
        quoteId: dto.quoteId,
      });
      return new OrderResponseDto(order);
    } catch (error) {
      if (error instanceof QuoteNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof QuoteDoesNotBelongToVisitError ||
        error instanceof QuoteNotApprovedForOrderError ||
        error instanceof QuoteAlreadyConvertedError
      ) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'List orders with pagination and filters (HU-34)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of orders matching filter criteria',
    type: PaginatedResponseDto<OrderResponseDto>,
  })
  async list(
    @Query() query: ListOrdersQueryDto,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    const result = await this.listOrdersUseCase.execute({
      clientId: query.clientId,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.parsedPage,
      limit: query.parsedLimit,
    });

    return PaginatedResponseDto.create(
      result,
      (order) => new OrderResponseDto(order),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details by ID (HU-33)' })
  @ApiResponse({
    status: 200,
    description: 'Order details and line items',
    type: OrderResponseDto,
  })
  async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<OrderResponseDto> {
    try {
      const order = await this.getOrderByIdUseCase.execute(id);
      return new OrderResponseDto(order);
    } catch (error) {
      if (error instanceof OrderNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Patch(':id/status')
  @ApiOperation({
    summary:
      'Change order status (CREATED -> DISPATCHED -> DELIVERED/CANCELLED) with activity log (HU-33)',
  })
  @ApiResponse({
    status: 200,
    description: 'Order status updated and audited in activity log',
    type: OrderResponseDto,
  })
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeOrderStatusDto,
    @Req() request: Request,
  ): Promise<OrderResponseDto> {
    const actorId = await this.currentAdvisor.extract(request).catch(() => 1);

    try {
      const updatedOrder = await this.changeOrderStatusUseCase.execute({
        orderId: id,
        newStatus: dto.status,
        actorId,
      });
      return new OrderResponseDto(updatedOrder);
    } catch (error) {
      if (error instanceof OrderNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof InvalidOrderStatusTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
