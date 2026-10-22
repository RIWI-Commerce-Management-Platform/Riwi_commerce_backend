import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../../auth/domain/user-role.enum.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { AdvisorService } from '../application/advisor.service.js';
import { CreateAdvisorDto } from './dto/create-advisor.dto.js';
import { UpdateAdvisorDto } from './dto/update-advisor.dto.js';
import { UpdateAdvisorStatusDto } from './dto/update-advisor-status.dto.js';
import { AdvisorResponseDto } from './dto/advisor-response.dto.js';

@ApiTags('Advisors')
@ApiBearerAuth()
@Controller('advisors')
@Roles(UserRole.ADMINISTRADOR)
@ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
@ApiResponse({ status: 403, description: 'The Admin role is required.' })
export class AdvisorsController {
  constructor(private readonly advisorService: AdvisorService) {}

  @Post()
  @ApiOperation({ summary: 'Create an advisor linked to an ASESOR user' })
  @ApiResponse({ status: 201, description: 'Advisor created.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid advisor data or user role.',
  })
  @ApiResponse({ status: 404, description: 'Linked user not found.' })
  @ApiResponse({ status: 409, description: 'Email or user is already linked.' })
  async create(@Body() dto: CreateAdvisorDto): Promise<AdvisorResponseDto> {
    return new AdvisorResponseDto(await this.advisorService.create(dto));
  }

  @Get()
  @ApiOperation({
    summary: 'List advisors, including inactive advisors by default',
  })
  @ApiResponse({ status: 200, description: 'Advisor list.' })
  async list(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<AdvisorResponseDto[]> {
    if (
      includeInactive !== undefined &&
      includeInactive !== 'true' &&
      includeInactive !== 'false'
    ) {
      throw new BadRequestException('includeInactive must be true or false');
    }
    const advisors = await this.advisorService.list(includeInactive !== 'false');
    return advisors.map((advisor) => new AdvisorResponseDto(advisor));
  }

  @Get('available-for-routes')
  @ApiOperation({
    summary: 'List active advisors available for new route assignments',
  })
  @ApiResponse({ status: 200, description: 'Active advisors only.' })
  async listAvailableForRoutes(): Promise<AdvisorResponseDto[]> {
    const advisors = await this.advisorService.listAvailableForRoutes();
    return advisors.map((advisor) => new AdvisorResponseDto(advisor));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an advisor by ID' })
  @ApiResponse({ status: 200, description: 'Advisor details.' })
  @ApiResponse({ status: 404, description: 'Advisor not found.' })
  async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AdvisorResponseDto> {
    return new AdvisorResponseDto(await this.advisorService.getById(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit advisor details or linked user' })
  @ApiResponse({ status: 200, description: 'Advisor updated.' })
  @ApiResponse({
    status: 404,
    description: 'Advisor or linked user not found.',
  })
  @ApiResponse({ status: 409, description: 'Email or user is already linked.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdvisorDto,
  ): Promise<AdvisorResponseDto> {
    return new AdvisorResponseDto(await this.advisorService.update(id, dto));
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or deactivate an advisor' })
  @ApiResponse({ status: 200, description: 'Advisor status updated.' })
  @ApiResponse({ status: 400, description: 'estado must be a boolean.' })
  @ApiResponse({ status: 404, description: 'Advisor not found.' })
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdvisorStatusDto,
  ): Promise<AdvisorResponseDto> {
    return this.advisorService
      .setStatus(id, dto?.estado)
      .then((advisor) => new AdvisorResponseDto(advisor));
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate an advisor without physically deleting it',
  })
  @ApiResponse({ status: 200, description: 'Advisor deactivated.' })
  @ApiResponse({ status: 404, description: 'Advisor not found.' })
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AdvisorResponseDto> {
    return new AdvisorResponseDto(await this.advisorService.deactivate(id));
  }
}
