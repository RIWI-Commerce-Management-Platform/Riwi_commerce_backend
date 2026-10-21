import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ListCatalogsUseCase } from '../application/list-catalogs.use-case.js';
import { ListCatalogByTypeUseCase } from '../application/list-catalog-by-type.use-case.js';
import { CreateCatalogItemUseCase } from '../application/create-catalog-item.use-case.js';
import { UpdateCatalogItemUseCase } from '../application/update-catalog-item.use-case.js';
import { SeedCatalogsUseCase } from '../application/seed-catalogs.use-case.js';
import {
  CatalogItemNotFoundError,
  InvalidCatalogTypeError,
} from '../domain/catalog-errors.js';
import { AllCatalogsResponseDto } from './dto/all-catalogs-response.dto.js';
import { CatalogItemResponseDto } from './dto/catalog-item-response.dto.js';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto.js';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto.js';

@ApiTags('Catalogs')
@Controller('catalogs')
export class CatalogsController {
  constructor(
    private readonly listCatalogsUseCase: ListCatalogsUseCase,
    private readonly listCatalogByTypeUseCase: ListCatalogByTypeUseCase,
    private readonly createCatalogItemUseCase: CreateCatalogItemUseCase,
    private readonly updateCatalogItemUseCase: UpdateCatalogItemUseCase,
    private readonly seedCatalogsUseCase: SeedCatalogsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all system catalogs grouped',
    description:
      'Returns zones (Barranquilla, Soledad, Malambo, Galapa), client types, potentials, client statuses, portfolios, and visit results in a single call.',
  })
  @ApiOkResponse({
    description: 'All system catalogs grouped by category.',
    type: AllCatalogsResponseDto,
  })
  async getAll(): Promise<AllCatalogsResponseDto> {
    const data = await this.listCatalogsUseCase.execute();
    return new AllCatalogsResponseDto(data);
  }

  @Get('seed/status')
  @ApiOperation({ summary: 'Check catalogs seed record counts' })
  async getSeedStatus() {
    return this.listCatalogsUseCase.execute();
  }

  @Post('seed/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually trigger initial catalogs seed',
    description:
      'Seeds default zones for Barranquilla metro area, client types, potentials, statuses, portfolios, and visit results if not already populated.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Seed execution completed.',
  })
  async runSeed() {
    return this.seedCatalogsUseCase.execute();
  }

  @Get(':type')
  @ApiOperation({
    summary: 'Get items for a specific catalog type',
    description:
      'Valid types: client-types, potentials, client-statuses, portfolios, visit-results',
  })
  @ApiParam({
    name: 'type',
    enum: [
      'client-types',
      'potentials',
      'client-statuses',
      'portfolios',
      'visit-results',
    ],
  })
  @ApiOkResponse({
    description: 'List of items in the specified catalog.',
    type: [CatalogItemResponseDto],
  })
  @ApiBadRequestResponse({ description: 'Invalid catalog type specified.' })
  async getByType(
    @Param('type') type: string,
  ): Promise<CatalogItemResponseDto[]> {
    try {
      const items = await this.listCatalogByTypeUseCase.execute(type);
      return (items as any[]).map((item) => new CatalogItemResponseDto(item));
    } catch (error) {
      if (error instanceof InvalidCatalogTypeError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Post(':type')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new catalog item (Admin)' })
  @ApiParam({
    name: 'type',
    enum: [
      'client-types',
      'potentials',
      'client-statuses',
      'portfolios',
      'visit-results',
    ],
  })
  @ApiBody({ type: CreateCatalogItemDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Catalog item created successfully.',
    type: CatalogItemResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid catalog type.' })
  async create(
    @Param('type') type: string,
    @Body() dto: CreateCatalogItemDto,
  ): Promise<CatalogItemResponseDto> {
    try {
      const item = await this.createCatalogItemUseCase.execute({
        type,
        name: dto.name,
        order: dto.order,
        description: dto.description,
      });
      return new CatalogItemResponseDto(item);
    } catch (error) {
      if (error instanceof InvalidCatalogTypeError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Patch(':type/:id')
  @ApiOperation({
    summary: 'Update an existing catalog item using PATCH (Admin)',
  })
  @ApiParam({
    name: 'type',
    enum: [
      'client-types',
      'potentials',
      'client-statuses',
      'portfolios',
      'visit-results',
    ],
  })
  @ApiParam({ name: 'id', type: String, example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  @ApiBody({ type: UpdateCatalogItemDto })
  @ApiOkResponse({
    description: 'Catalog item updated successfully.',
    type: CatalogItemResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Catalog item not found.' })
  @ApiBadRequestResponse({ description: 'Invalid catalog type.' })
  async update(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() dto: UpdateCatalogItemDto,
  ): Promise<CatalogItemResponseDto> {
    try {
      const item = await this.updateCatalogItemUseCase.execute({
        type,
        id,
        name: dto.name,
        order: dto.order,
        description: dto.description,
        isActive: dto.isActive,
      });
      return new CatalogItemResponseDto(item);
    } catch (error) {
      if (error instanceof InvalidCatalogTypeError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof CatalogItemNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
