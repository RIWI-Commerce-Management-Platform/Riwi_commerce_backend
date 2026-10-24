import {
  Controller,
  Get,
  Query,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import {
  ExportReportUseCase,
  ReportType,
} from '../application/export-report.use-case.js';
import { ReportQueryDto } from './dto/report-query.dto.js';
import { CurrentActorProvider } from '../../../shared/auth/domain/current-actor.provider.js';
import { queryValidationPipe } from '../../../shared/pagination/query-validation.pipe.js';
import {
  endOfDay,
  startOfDay,
} from '../../../shared/pagination/date-range-query.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

/** HU-38: CSV exports (UTF-8 with BOM) with the active filters. */
@ApiTags('Reports')
@ApiForbiddenResponse({ description: 'Only admins and regional directors.' })
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.DIRECTOR_REGIONAL)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly exportReportUseCase: ExportReportUseCase,
    private readonly currentActor: CurrentActorProvider,
  ) {}

  @Get('visits.csv')
  @ApiOperation({ summary: 'Export visits to CSV (HU-38)' })
  @ApiProduces('text/csv')
  @ApiResponse({ status: 200, description: 'CSV file download.' })
  visits(
    @Query(queryValidationPipe()) query: ReportQueryDto,
    @Req() request: Request,
  ): Promise<StreamableFile> {
    return this.export('visits', query, request);
  }

  @Get('clients.csv')
  @ApiOperation({ summary: 'Export clients to CSV (HU-38)' })
  @ApiProduces('text/csv')
  @ApiResponse({ status: 200, description: 'CSV file download.' })
  clients(
    @Query(queryValidationPipe()) query: ReportQueryDto,
    @Req() request: Request,
  ): Promise<StreamableFile> {
    return this.export('clients', query, request);
  }

  @Get('quotes.csv')
  @ApiOperation({ summary: 'Export quotes to CSV (HU-38)' })
  @ApiProduces('text/csv')
  @ApiResponse({ status: 200, description: 'CSV file download.' })
  quotes(
    @Query(queryValidationPipe()) query: ReportQueryDto,
    @Req() request: Request,
  ): Promise<StreamableFile> {
    return this.export('quotes', query, request);
  }

  @Get('orders.csv')
  @ApiOperation({ summary: 'Export orders to CSV (HU-38)' })
  @ApiProduces('text/csv')
  @ApiResponse({ status: 200, description: 'CSV file download.' })
  orders(
    @Query(queryValidationPipe()) query: ReportQueryDto,
    @Req() request: Request,
  ): Promise<StreamableFile> {
    return this.export('orders', query, request);
  }

  private async export(
    type: ReportType,
    query: ReportQueryDto,
    request: Request,
  ): Promise<StreamableFile> {
    const actor = await this.currentActor.extract(request);
    const report = await this.exportReportUseCase.execute(
      type,
      {
        startDate: startOfDay(query.startDate),
        endDate: endOfDay(query.endDate),
        zoneId: query.zoneId,
        advisorId: query.advisorId,
        clientId: query.clientId,
        status: query.status,
        search: query.search,
        clientTypeId: query.clientTypeId,
        potentialId: query.potentialId,
        municipality: query.municipality,
        isActive: query.isActive,
      },
      actor,
      query.separator === 'semicolon' ? ';' : ',',
    );

    return new StreamableFile(Buffer.from(report.content, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${report.filename}"`,
    });
  }
}
