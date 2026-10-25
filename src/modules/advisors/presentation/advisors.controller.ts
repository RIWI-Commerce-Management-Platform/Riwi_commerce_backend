import {
  BadRequestException,
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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CreateAdvisorUseCase } from '../application/create-advisor.use-case.js';
import { ListAdvisorsUseCase } from '../application/list-advisors.use-case.js';
import { GetAdvisorUseCase } from '../application/get-advisor.use-case.js';
import { UpdateAdvisorUseCase } from '../application/update-advisor.use-case.js';
import { ChangeAdvisorStatusUseCase } from '../application/change-advisor-status.use-case.js';
import {
  AdvisorAccountCreationError,
  AdvisorEmailAlreadyExistsError,
  AdvisorNotFoundError,
  AdvisorZoneNotFoundError,
} from '../domain/advisor.errors.js';
import { CreateAdvisorDto } from './dto/create-advisor.dto.js';
import { UpdateAdvisorDto } from './dto/update-advisor.dto.js';
import { ChangeAdvisorStatusDto } from './dto/change-advisor-status.dto.js';
import { FindAdvisorsQueryDto } from './dto/find-advisors-query.dto.js';
import { AdvisorResponseDto } from './dto/advisor-response.dto.js';
import { PaginatedResponseDto } from '../../../shared/pagination/paginated-response.dto.js';
import { queryValidationPipe } from '../../../shared/pagination/query-validation.pipe.js';
import { CurrentActorProvider } from '../../../shared/auth/domain/current-actor.provider.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

@ApiTags('Advisors')
@ApiForbiddenResponse({ description: 'The role is not allowed.' })
@UseGuards(RolesGuard)
@Controller('advisors')
export class AdvisorsController {
  constructor(
    private readonly createAdvisorUseCase: CreateAdvisorUseCase,
    private readonly listAdvisorsUseCase: ListAdvisorsUseCase,
    private readonly getAdvisorUseCase: GetAdvisorUseCase,
    private readonly updateAdvisorUseCase: UpdateAdvisorUseCase,
    private readonly changeAdvisorStatusUseCase: ChangeAdvisorStatusUseCase,
    private readonly currentActor: CurrentActorProvider,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an advisor with its login account (HU-07, Admin only)',
    description: 'Creates a user with the ASESOR role and its advisor profile.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: AdvisorResponseDto })
  @ApiConflictResponse({ description: 'The email is already registered.' })
  @ApiNotFoundResponse({ description: 'Zone not found.' })
  async create(@Body() dto: CreateAdvisorDto): Promise<AdvisorResponseDto> {
    try {
      return new AdvisorResponseDto(
        await this.createAdvisorUseCase.execute(dto),
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR_REGIONAL)
  @ApiOperation({
    summary: 'List advisors (HU-07)',
    description: 'A regional director only sees the advisors of their zone.',
  })
  @ApiOkResponse({ type: [AdvisorResponseDto] })
  async list(
    @Query(queryValidationPipe()) query: FindAdvisorsQueryDto,
    @Req() request: Request,
  ): Promise<PaginatedResponseDto<AdvisorResponseDto>> {
    const actor = await this.currentActor.extract(request);
    const result = await this.listAdvisorsUseCase.execute(
      {
        search: query.search,
        zoneId: query.zoneId,
        isActive: query.isActive,
        page: query.parsedPage,
        limit: query.parsedLimit,
      },
      actor,
    );
    return PaginatedResponseDto.create(
      result,
      (advisor) => new AdvisorResponseDto(advisor),
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR_REGIONAL)
  @ApiOperation({ summary: 'Get an advisor by user id (HU-07)' })
  @ApiParam({ name: 'id', type: Number, example: 5 })
  @ApiOkResponse({ type: AdvisorResponseDto })
  @ApiNotFoundResponse({ description: 'Advisor not found.' })
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ): Promise<AdvisorResponseDto> {
    const actor = await this.currentActor.extract(request);
    try {
      return new AdvisorResponseDto(
        await this.getAdvisorUseCase.execute(id, actor),
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an advisor (HU-07, Admin only)' })
  @ApiParam({ name: 'id', type: Number, example: 5 })
  @ApiOkResponse({ type: AdvisorResponseDto })
  @ApiNotFoundResponse({ description: 'Advisor or zone not found.' })
  @ApiConflictResponse({ description: 'The email is already registered.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdvisorDto,
  ): Promise<AdvisorResponseDto> {
    try {
      return new AdvisorResponseDto(
        await this.updateAdvisorUseCase.execute({ userId: id, ...dto }),
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Activate or deactivate an advisor (HU-07, Admin only)',
    description:
      'There is no physical delete. Deactivating signs the advisor out and blocks new sign-ins.',
  })
  @ApiParam({ name: 'id', type: Number, example: 5 })
  @ApiOkResponse({ type: AdvisorResponseDto })
  @ApiNotFoundResponse({ description: 'Advisor not found.' })
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeAdvisorStatusDto,
  ): Promise<AdvisorResponseDto> {
    try {
      return new AdvisorResponseDto(
        await this.changeAdvisorStatusUseCase.execute({
          userId: id,
          isActive: dto.isActive,
        }),
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if (
      error instanceof AdvisorNotFoundError ||
      error instanceof AdvisorZoneNotFoundError
    ) {
      throw new NotFoundException(error.message);
    }
    if (error instanceof AdvisorEmailAlreadyExistsError) {
      throw new ConflictException(error.message);
    }
    if (error instanceof AdvisorAccountCreationError) {
      throw new BadRequestException(error.message);
    }
    throw error;
  }
}
