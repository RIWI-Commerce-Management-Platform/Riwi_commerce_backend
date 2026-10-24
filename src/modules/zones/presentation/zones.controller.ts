import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateZoneUseCase } from '../application/create-zone.use-case.js';
import { ListZonesUseCase } from '../application/list-zones.use-case.js';
import { CreateZoneDto } from './dto/create-zone.dto.js';
import { ZoneResponseDto } from './dto/zone-response.dto.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

@ApiTags('Zones')
@Controller('zones')
@Roles(
  UserRole.ADMINISTRADOR,
  UserRole.DIRECTOR_REGIONAL,
  UserRole.ASESOR,
  UserRole.CLIENTE,
)
export class ZonesController {
  constructor(
    private readonly createZoneUseCase: CreateZoneUseCase,
    private readonly listZonesUseCase: ListZonesUseCase,
  ) {}

  @Get()
  async list(): Promise<ZoneResponseDto[]> {
    const zones = await this.listZonesUseCase.execute();
    return zones.map((zone) => new ZoneResponseDto(zone));
  }

  @Post()
  @Roles(UserRole.ADMINISTRADOR)
  async create(@Body() dto: CreateZoneDto): Promise<ZoneResponseDto> {
    const zone = await this.createZoneUseCase.execute({ name: dto.name });
    return new ZoneResponseDto(zone);
  }
}
