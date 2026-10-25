import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ListClientPortfoliosUseCase } from '../application/list-client-portfolios.use-case.js';
import { AddClientPortfolioUseCase } from '../application/add-client-portfolio.use-case.js';
import { RemoveClientPortfolioUseCase } from '../application/remove-client-portfolio.use-case.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import {
  ClientPortfolioAlreadyAssignedError,
  ClientPortfolioNotFoundError,
  PortfolioNotFoundError,
} from '../domain/client-portfolio.errors.js';
import { AddClientPortfolioDto } from './dto/add-client-portfolio.dto.js';
import { ClientPortfolioResponseDto } from './dto/client-portfolio-response.dto.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';

@ApiTags('Client Portfolios')
@Controller('clients/:clientId/portfolios')
export class ClientPortfoliosController {
  constructor(
    private readonly listClientPortfoliosUseCase: ListClientPortfoliosUseCase,
    private readonly addClientPortfolioUseCase: AddClientPortfolioUseCase,
    private readonly removeClientPortfolioUseCase: RemoveClientPortfolioUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List the portfolios associated with a client (HU-16)',
  })
  @ApiParam({ name: 'clientId', type: Number, example: 1 })
  @ApiOkResponse({ type: [ClientPortfolioResponseDto] })
  @ApiNotFoundResponse({ description: 'Client not found.' })
  async list(
    @Param('clientId', ParseIntPipe) clientId: number,
  ): Promise<ClientPortfolioResponseDto[]> {
    try {
      const portfolios =
        await this.listClientPortfoliosUseCase.execute(clientId);
      return portfolios.map((item) => new ClientPortfolioResponseDto(item));
    } catch (error) {
      if (error instanceof ClientNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Associate a portfolio with a client (HU-16)',
    description:
      'Stores the registration date and writes to the client activity log.',
  })
  @ApiParam({ name: 'clientId', type: Number, example: 1 })
  @ApiResponse({ status: HttpStatus.CREATED, type: ClientPortfolioResponseDto })
  @ApiNotFoundResponse({ description: 'Client or active portfolio not found.' })
  @ApiConflictResponse({ description: 'The portfolio is already associated.' })
  async add(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Body() dto: AddClientPortfolioDto,
    @CurrentUser('id') actorId: number,
  ): Promise<ClientPortfolioResponseDto> {
    try {
      const saved = await this.addClientPortfolioUseCase.execute({
        clientId,
        portfolioId: dto.portfolioId,
        actorId,
      });
      return new ClientPortfolioResponseDto(saved);
    } catch (error) {
      if (
        error instanceof ClientNotFoundError ||
        error instanceof PortfolioNotFoundError
      ) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof ClientPortfolioAlreadyAssignedError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Delete(':portfolioId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a portfolio from a client (HU-16)' })
  @ApiParam({ name: 'clientId', type: Number, example: 1 })
  @ApiParam({ name: 'portfolioId', type: Number, example: 2 })
  @ApiNoContentResponse({ description: 'Portfolio removed from the client.' })
  @ApiNotFoundResponse({ description: 'The portfolio is not associated.' })
  async remove(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
    @CurrentUser('id') actorId: number,
  ): Promise<void> {
    try {
      await this.removeClientPortfolioUseCase.execute({
        clientId,
        portfolioId,
        actorId,
      });
    } catch (error) {
      if (error instanceof ClientPortfolioNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
