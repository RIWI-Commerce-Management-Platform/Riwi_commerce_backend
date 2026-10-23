import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiHeader,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateQuoteUseCase } from '../application/create-quote.use-case.js';
import { CreateQuoteFromVisitUseCase } from '../application/create-quote-from-visit.use-case.js';
import { GetQuoteByIdUseCase } from '../application/get-quote-by-id.use-case.js';
import { CreateQuoteDto } from './dto/create-quote.dto.js';
import { CreateQuoteFromVisitDto } from './dto/create-quote-from-visit.dto.js';
import { QuoteResponseDto } from './dto/quote-response.dto.js';
import { ClientNotFoundError } from '../domain/errors/client-not-found.error.js';
import { CurrentAdvisorProvider } from '../../../shared/auth/domain/current-advisor.provider.js';

@ApiTags('Quotes')
@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly createQuoteUseCase: CreateQuoteUseCase,
    private readonly createQuoteFromVisitUseCase: CreateQuoteFromVisitUseCase,
    private readonly getQuoteByIdUseCase: GetQuoteByIdUseCase,
    private readonly currentAdvisor: CurrentAdvisorProvider,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quote with products' })
  @ApiResponse({
    status: 201,
    description:
      'Quote created successfully with calculated totals and consecutive number',
    type: QuoteResponseDto,
  })
  async create(@Body() dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    try {
      const quote = await this.createQuoteUseCase.execute({
        clientId: dto.clientId,
        notes: dto.notes,
        documentKey: dto.documentKey,
        items: dto.items,
      });
      return new QuoteResponseDto(quote);
    } catch (error) {
      if (error instanceof ClientNotFoundError) {
        throw new NotFoundException(error.message);
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
    summary: 'Create a quote using the client from an advisor-owned visit',
  })
  @ApiBody({ type: CreateQuoteFromVisitDto })
  @ApiResponse({
    status: 201,
    description:
      'Quote created with its client ID derived from the requested visit.',
    type: QuoteResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Visit or visit client not found for this advisor.',
  })
  @ApiResponse({ status: 400, description: 'Invalid quote request body.' })
  async createFromVisit(
    @Param('visitId', ParseIntPipe) visitId: number,
    @Req() request: Request,
    @Body() dto: CreateQuoteFromVisitDto,
  ): Promise<QuoteResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);
    try {
      const quote = await this.createQuoteFromVisitUseCase.execute(
        visitId,
        advisorId,
        {
          notes: dto.notes,
          documentKey: dto.documentKey,
          items: dto.items,
        },
      );

      return new QuoteResponseDto(quote);
    } catch (error) {
      if (error instanceof ClientNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quote details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Quote details and line items',
    type: QuoteResponseDto,
  })
  async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<QuoteResponseDto> {
    const quote = await this.getQuoteByIdUseCase.execute(id);
    return new QuoteResponseDto(quote);
  }
}
