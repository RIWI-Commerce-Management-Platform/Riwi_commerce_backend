import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';

import {
  ApiHeader,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentAdvisorProvider } from '../../../../shared/auth/domain/current-advisor.provider.js';

import { GetVisitAgendaUseCase } from '../../application/use-cases/get-visit-agenda.use-case.js';

import { GetVisitByIdUseCase } from '../../application/use-cases/get-visit-by-id.use-case.js';

import { StartVisitUseCase } from '../../application/use-cases/start-visit.use-case.js';

import { RegisterVisitResultUseCase } from '../../application/use-cases/register-visit-result.use-case.js';

import { RescheduleVisitUseCase } from '../../application/use-cases/reschedule-visit.use-case.js';

import { MarkVisitNotVisitedUseCase } from '../../application/use-cases/mark-visit-not-visited.use-case.js';

import { GetVisitAttachmentsUseCase } from '../../application/use-cases/get-visit-attachments.use-case.js';

import { UploadVisitAttachmentUseCase } from '../../application/use-cases/upload-visit-attachment.use-case.js';

import { VisitAgendaQueryDto } from '../dtos/visit-agenda-query.dto.js';

import { VisitAttachmentResponseDto } from '../dtos/visit-attachment-response.dto.js';

import { RegisterVisitResultDto } from '../dtos/register-visit-result.dto.js';

import { RescheduleVisitDto } from '../dtos/reschedule-visit.dto.js';

import { VisitSummaryResponseDto } from '../dtos/visit-summary-response.dto.js';

import { VisitDetailResponseDto } from '../dtos/visit-detail-response.dto.js';

import { FILE_STORAGE_MAX_FILE_SIZE_BYTES } from '../../../../shared/file-storage/domain/file-storage.constants.js';

interface UploadedVisitFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

@ApiTags('Visits')
@ApiHeader({
  name: 'x-user-id',
  required: true,
  // TEMPORARY: placeholder header while Better Auth is not integrated
  // (owner: Efraín, E1). It must be replaced by the real session/JWT adapter.
  description: 'TEMPORARY advisor id header. Will be replaced by Better Auth.',
  deprecated: true,
})
@ApiUnauthorizedResponse({ description: 'Missing or invalid advisor header.' })
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
@Controller('visits')
export class VisitsController {
  constructor(
    private readonly getVisitAgenda: GetVisitAgendaUseCase,
    private readonly getVisitById: GetVisitByIdUseCase,
    private readonly startVisit: StartVisitUseCase,
    private readonly registerVisitResult: RegisterVisitResultUseCase,
    private readonly rescheduleVisit: RescheduleVisitUseCase,
    private readonly markVisitNotVisited: MarkVisitNotVisitedUseCase,
    private readonly currentAdvisor: CurrentAdvisorProvider,
    private readonly getVisitAttachments: GetVisitAttachmentsUseCase,
    private readonly uploadVisitAttachment: UploadVisitAttachmentUseCase,
  ) {}

  @Get('agenda')
  @ApiOperation({
    summary: 'Get the authenticated advisor agenda for a day or a week',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week'],
    description: 'Defaults to day.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: "Reference date in 'YYYY-MM-DD' format. Defaults to today.",
    example: '2026-10-20',
  })
  @ApiResponse({
    status: 200,
    description: 'Visits ordered by scheduled date and time.',
    type: [VisitSummaryResponseDto],
  })
  async getAgenda(
    @Req() request: Request,
    @Query() query: VisitAgendaQueryDto,
  ): Promise<VisitSummaryResponseDto[]> {
    const advisorId = await this.currentAdvisor.extract(request);

    const visits = await this.getVisitAgenda.execute(
      advisorId,
      query.period ?? 'day',
      query.date,
    );

    return visits.map((visit) => new VisitSummaryResponseDto(visit));
  }

  @Post(':id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: FILE_STORAGE_MAX_FILE_SIZE_BYTES },
    }),
  )
  @ApiOperation({ summary: 'Attach a photo or document to a visit' })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Attachment stored and available through a temporary URL.',
    type: VisitAttachmentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing file or unsupported file type.',
  })
  @ApiResponse({
    status: 404,
    description: 'Visit not found for this advisor.',
  })
  @ApiResponse({
    status: 413,
    description: 'File exceeds the 10 MiB limit.',
  })
  async uploadAttachment(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
    @UploadedFile() file?: UploadedVisitFile,
  ): Promise<VisitAttachmentResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);

    if (!file) {
      throw new BadRequestException('A file is required.');
    }

    const attachment = await this.uploadVisitAttachment.execute(id, advisorId, {
      buffer: file.buffer,
      filename: file.originalname,
      mimetype: file.mimetype,
    });
    return new VisitAttachmentResponseDto(attachment);
  }

  @Get(':id/attachments')
  @ApiOperation({ summary: 'List visit attachments with temporary URLs' })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  @ApiResponse({
    status: 200,
    description: 'Attachments ordered by upload time.',
    type: [VisitAttachmentResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Visit not found for this advisor.',
  })
  async listAttachments(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ): Promise<VisitAttachmentResponseDto[]> {
    const advisorId = await this.currentAdvisor.extract(request);
    const attachments = await this.getVisitAttachments.execute(id, advisorId);

    return attachments.map(
      (attachment) => new VisitAttachmentResponseDto(attachment),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get visit details for the authenticated advisor' })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  @ApiResponse({
    status: 200,
    description:
      'Visit details including client/contact information when available.',
    type: VisitDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Visit not found for this advisor.',
  })
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ): Promise<VisitDetailResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);

    const visit = await this.getVisitById.execute(id, advisorId);

    return new VisitDetailResponseDto(visit);
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Start a pending visit' })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  @ApiResponse({
    status: 200,
    description: 'Visit moved to IN_PROGRESS with its actual start time.',
    type: VisitDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Visit is not in the PENDING status.',
  })
  @ApiResponse({
    status: 404,
    description: 'Visit not found for this advisor.',
  })
  async start(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ): Promise<VisitDetailResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);

    const visit = await this.startVisit.execute(id, advisorId);

    return new VisitDetailResponseDto(visit);
  }

  @Patch(':id/result')
  @ApiOperation({ summary: 'Register the result of an in-progress visit' })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  @ApiResponse({
    status: 200,
    description:
      'Visit moved to VISITED with end time, observations and selected results.',
    type: VisitDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid payload, invalid result ids, observations over 500 characters or invalid status transition.',
  })
  @ApiResponse({
    status: 404,
    description: 'Visit not found for this advisor.',
  })
  async registerResult(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
    @Body() body: RegisterVisitResultDto,
  ): Promise<VisitDetailResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);

    const visit = await this.registerVisitResult.execute(id, advisorId, {
      endTime: body.endTime,
      observations: body.observations,
      results: body.results,
    });

    return new VisitDetailResponseDto(visit);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule a pending visit' })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  @ApiBody({ type: RescheduleVisitDto })
  @ApiResponse({
    status: 200,
    description: 'Visit rescheduled and reflected in the advisor agenda.',
    type: VisitDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid scheduled date or visit status transition.',
  })
  @ApiResponse({
    status: 404,
    description: 'Visit not found for this advisor.',
  })
  async reschedule(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
    @Body() body: RescheduleVisitDto,
  ): Promise<VisitDetailResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);
    const visit = await this.rescheduleVisit.execute(
      id,
      advisorId,
      body.scheduledAt,
    );

    return new VisitDetailResponseDto(visit);
  }

  @Patch(':id/not-visited')
  @ApiOperation({ summary: 'Mark a visit as not visited' })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  @ApiResponse({
    status: 200,
    description: 'Visit marked as NOT_VISITED.',
    type: VisitDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Visit status does not allow this transition.',
  })
  @ApiResponse({
    status: 404,
    description: 'Visit not found for this advisor.',
  })
  async markNotVisited(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ): Promise<VisitDetailResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);
    const visit = await this.markVisitNotVisited.execute(id, advisorId);

    return new VisitDetailResponseDto(visit);
  }
}
