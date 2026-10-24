import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateZoneUseCase } from '../application/create-zone.use-case.js';
import { ListZonesUseCase } from '../application/list-zones.use-case.js';
import { UpdateZoneUseCase } from '../application/update-zone.use-case.js';
import { ZoneNameAlreadyExistsError } from '../domain/zone-name-already-exists.error.js';
import { ZoneNotFoundError } from '../domain/zone-not-found.error.js';
import { CreateZoneDto } from './dto/create-zone.dto.js';
import { UpdateZoneDto } from './dto/update-zone.dto.js';
import { ZoneResponseDto } from './dto/zone-response.dto.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

@ApiTags('Zones')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
@Controller('zones')
export class ZonesController {
  constructor(
    private readonly createZoneUseCase: CreateZoneUseCase,
    private readonly listZonesUseCase: ListZonesUseCase,
    private readonly updateZoneUseCase: UpdateZoneUseCase,
  ) {}

  @Get()
  async list(): Promise<ZoneResponseDto[]> {
    const zones = await this.listZonesUseCase.execute();
    return zones.map((zone) => new ZoneResponseDto(zone));
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiConflictResponse({ description: 'A zone with that name already exists.' })
  async create(@Body() dto: CreateZoneDto): Promise<ZoneResponseDto> {
    try {
      const zone = await this.createZoneUseCase.execute({ name: dto.name });
      return new ZoneResponseDto(zone);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiNotFoundResponse({ description: 'Zone not found.' })
  @ApiConflictResponse({ description: 'A zone with that name already exists.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateZoneDto,
  ): Promise<ZoneResponseDto> {
    try {
      const zone = await this.updateZoneUseCase.execute({
        id,
        name: dto.name,
        isActive: dto.isActive,
      });
      return new ZoneResponseDto(zone);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  private toHttpError(error: unknown): unknown {
    if (error instanceof ZoneNameAlreadyExistsError) {
      return new ConflictException(error.message);
    }
    if (error instanceof ZoneNotFoundError) {
      return new NotFoundException(error.message);
    }
    return error;
  }
}
