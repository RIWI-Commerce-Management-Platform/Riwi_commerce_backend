import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateClientUseCase } from '../application/create-client.use-case.js';
import { UpdateClientUseCase } from '../application/update-client.use-case.js';
import { ToggleClientStatusUseCase } from '../application/toggle-client-status.use-case.js';
import { FindClientsUseCase } from '../application/find-clients.use-case.js';
import { GetClientByIdUseCase } from '../application/get-client-by-id.use-case.js';
import { ClientNitAlreadyExistsError } from '../domain/client-nit-already-exists.error.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { ToggleClientStatusDto } from './dto/toggle-client-status.dto.js';
import { ClientResponseDto } from './dto/client-response.dto.js';
import { FindClientsQueryDto } from './dto/find-clients-query.dto.js';
import { PaginatedClientResponseDto } from './dto/paginated-client-response.dto.js';
import { PaginatedResponseDto } from '../../../shared/pagination/paginated-response.dto.js';

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly updateClientUseCase: UpdateClientUseCase,
    private readonly toggleClientStatusUseCase: ToggleClientStatusUseCase,
    private readonly findClientsUseCase: FindClientsUseCase,
    private readonly getClientByIdUseCase: GetClientByIdUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Search and filter clients with pagination and coordinates',
  })
  @ApiOkResponse({
    description: 'Paginated list of clients matching criteria.',
    type: PaginatedClientResponseDto,
  })
  async findClients(
    @Query() query: FindClientsQueryDto,
  ): Promise<PaginatedClientResponseDto> {
    const result = await this.findClientsUseCase.execute({
      search: query.search,
      zoneId: query.zoneId,
      clientTypeId: query.clientTypeId,
      potentialId: query.potentialId,
      municipality: query.municipality,
      isActive: query.parsedIsActive,
      page: query.parsedPage,
      limit: query.parsedLimit,
    });

    return PaginatedResponseDto.create(
      result,
      (client) => new ClientResponseDto(client),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client details by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Client details including coordinates.',
    type: ClientResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Client not found.' })
  async getClientById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ClientResponseDto> {
    try {
      const client = await this.getClientByIdUseCase.execute(id);
      return new ClientResponseDto(client);
    } catch (error) {
      if (error instanceof ClientNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new client' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The client has been successfully registered.',
    type: ClientResponseDto,
  })
  @ApiConflictResponse({
    description: 'A client with the specified NIT already exists.',
  })
  async create(@Body() dto: CreateClientDto): Promise<ClientResponseDto> {
    try {
      const client = await this.createClientUseCase.execute({
        nit: dto.nit,
        businessName: dto.businessName,
        commercialName: dto.commercialName,
        address: dto.address,
        department: dto.department,
        municipality: dto.municipality,
        neighborhood: dto.neighborhood,
        phone: dto.phone,
        email: dto.email,
        zoneId: dto.zoneId,
        clientTypeId: dto.clientTypeId,
        potentialId: dto.potentialId,
        clientStatusId: dto.clientStatusId,
        visitFrequencyDays: dto.visitFrequencyDays,
        latitude: dto.latitude,
        longitude: dto.longitude,
      });

      return new ClientResponseDto(client);
    } catch (error) {
      if (error instanceof ClientNitAlreadyExistsError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing client' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'The client has been successfully updated.',
    type: ClientResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Client not found.' })
  @ApiConflictResponse({
    description: 'The requested NIT is already taken by another client.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    try {
      const client = await this.updateClientUseCase.execute({
        id,
        nit: dto.nit,
        businessName: dto.businessName,
        commercialName: dto.commercialName,
        address: dto.address,
        department: dto.department,
        municipality: dto.municipality,
        neighborhood: dto.neighborhood,
        phone: dto.phone,
        email: dto.email,
        zoneId: dto.zoneId,
        clientTypeId: dto.clientTypeId,
        potentialId: dto.potentialId,
        clientStatusId: dto.clientStatusId,
        visitFrequencyDays: dto.visitFrequencyDays,
        latitude: dto.latitude,
        longitude: dto.longitude,
      });

      return new ClientResponseDto(client);
    } catch (error) {
      if (error instanceof ClientNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof ClientNitAlreadyExistsError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or deactivate a client' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'The client status has been updated successfully.',
    type: ClientResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Client not found.' })
  async toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto?: ToggleClientStatusDto,
  ): Promise<ClientResponseDto> {
    try {
      const client = await this.toggleClientStatusUseCase.execute({
        id,
        isActive: dto?.isActive,
      });

      return new ClientResponseDto(client);
    } catch (error) {
      if (error instanceof ClientNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
