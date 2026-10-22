import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RecordClientActivityUseCase } from '../application/record-client-activity.use-case.js';
import { GetClientHistoryUseCase } from '../application/get-client-history.use-case.js';
import { GetRecentInteractionsUseCase } from '../application/get-recent-interactions.use-case.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { CreateClientHistoryDto } from './dto/create-client-history.dto.js';
import { ClientHistoryResponseDto } from './dto/client-history-response.dto.js';
import { FindClientHistoryQueryDto } from './dto/find-client-history-query.dto.js';
import { PaginatedClientHistoryResponseDto } from './dto/paginated-client-history-response.dto.js';
import { PaginatedResponseDto } from '../../../shared/pagination/paginated-response.dto.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';

@ApiTags('Client History / Activity Log')
@Controller('clients')
export class ClientHistoryController {
  constructor(
    private readonly recordClientActivityUseCase: RecordClientActivityUseCase,
    private readonly getClientHistoryUseCase: GetClientHistoryUseCase,
    private readonly getRecentInteractionsUseCase: GetRecentInteractionsUseCase,
  ) {}

  @Get('interactions/recent')
  @ApiOperation({
    summary: 'Get recent commercial interactions across all clients',
    description:
      'Provides a feed of recent activity and interactions for the dashboard / advisor overview ("Últimas interacciones").',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description:
      'Maximum number of recent interaction entries to return (default 10, max 100)',
  })
  @ApiOkResponse({
    description:
      'List of recent interaction entries sorted descending by date.',
    type: [ClientHistoryResponseDto],
  })
  async getRecentInteractions(
    @Query('limit') limit?: string,
  ): Promise<ClientHistoryResponseDto[]> {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 10;
    const safeLimit =
      Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
    const results = await this.getRecentInteractionsUseCase.execute(safeLimit);
    return results.map((item) => ClientHistoryResponseDto.fromDomain(item));
  }

  @Get(':clientId/history')
  @ApiOperation({
    summary:
      'Get paginated history and activity timeline for a specific client',
    description:
      'Retrieves the chronological audit trail and interactions for the client ("Últimas interacciones" tab in client detail).',
  })
  @ApiParam({ name: 'clientId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Paginated activity log entries for the client.',
    type: PaginatedClientHistoryResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Client not found.' })
  async getClientHistory(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Query() query: FindClientHistoryQueryDto,
  ): Promise<PaginatedClientHistoryResponseDto> {
    try {
      const criteria = FindClientHistoryQueryDto.toCriteria(query);
      const result = await this.getClientHistoryUseCase.execute(
        clientId,
        criteria,
      );

      return PaginatedResponseDto.create(result, (item) =>
        ClientHistoryResponseDto.fromDomain(item),
      );
    } catch (error) {
      if (error instanceof ClientNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Post(':clientId/history')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Manually register an interaction or note on a client',
    description:
      'Records a commercial observation, note, phone call, or interaction directly into the client bitácora.',
  })
  @ApiParam({ name: 'clientId', type: Number, example: 1 })
  @ApiBody({ type: CreateClientHistoryDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Interaction registered successfully in client history.',
    type: ClientHistoryResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Client not found.' })
  async recordActivity(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Body() dto: CreateClientHistoryDto,
    @CurrentUser('id') userId: string,
  ): Promise<ClientHistoryResponseDto> {
    try {
      const history = await this.recordClientActivityUseCase.execute({
        clientId,
        action: dto.action,
        description: dto.description,
        userId,
        metadata: dto.metadata,
      });

      return ClientHistoryResponseDto.fromDomain(history);
    } catch (error) {
      if (error instanceof ClientNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
