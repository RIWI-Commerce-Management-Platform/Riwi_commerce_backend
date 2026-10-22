import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateQuoteUseCase } from '../application/create-quote.use-case.js';
import { GetQuoteByIdUseCase } from '../application/get-quote-by-id.use-case.js';
import { CreateQuoteDto } from './dto/create-quote.dto.js';
import { QuoteResponseDto } from './dto/quote-response.dto.js';
import { ClientNotFoundError } from '../domain/errors/client-not-found.error.js';

@ApiTags('Quotes')
@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly createQuoteUseCase: CreateQuoteUseCase,
    private readonly getQuoteByIdUseCase: GetQuoteByIdUseCase,
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
