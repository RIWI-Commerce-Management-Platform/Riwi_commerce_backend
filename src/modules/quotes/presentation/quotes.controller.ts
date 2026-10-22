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
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';
import { UserOrmEntity } from '../../auth/infrastructure/user.orm-entity.js';

@ApiTags('Quotes')
@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly createQuoteUseCase: CreateQuoteUseCase,
    private readonly getQuoteByIdUseCase: GetQuoteByIdUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR, UserRole.CLIENTE)
  @ApiOperation({ summary: 'Create a new quote with products' })
  @ApiResponse({
    status: 201,
    description:
      'Quote created successfully with calculated totals and consecutive number',
    type: QuoteResponseDto,
  })
  async create(
    @Body() dto: CreateQuoteDto,
    @CurrentUser() user: UserOrmEntity,
  ): Promise<QuoteResponseDto> {
    try {
      const quote = await this.createQuoteUseCase.execute({
        clientId: user.role === UserRole.CLIENTE ? user.idCliente! : dto.clientId,
        advisorId:
          user.role === UserRole.ASESOR ? user.idAsesor! : null,
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
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR, UserRole.CLIENTE)
  @ApiOperation({ summary: 'Get quote details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Quote details and line items',
    type: QuoteResponseDto,
  })
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserOrmEntity,
  ): Promise<QuoteResponseDto> {
    const scope =
      user.role === UserRole.ASESOR
        ? { advisorId: user.idAsesor! }
        : user.role === UserRole.CLIENTE
          ? { clientId: user.idCliente! }
          : undefined;
    const quote = await this.getQuoteByIdUseCase.execute(id, scope);
    return new QuoteResponseDto(quote);
  }
}
