import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { CreateQuoteUseCase } from '../application/create-quote.use-case.js';
import { GetQuoteByIdUseCase } from '../application/get-quote-by-id.use-case.js';
import { AttachQuoteDocumentUseCase } from '../application/attach-quote-document.use-case.js';
import { ChangeQuoteStatusUseCase } from '../application/change-quote-status.use-case.js';
import { ListQuotesUseCase } from '../application/list-quotes.use-case.js';
import { CreateQuoteDto } from './dto/create-quote.dto.js';
import { ChangeQuoteStatusDto } from './dto/change-quote-status.dto.js';
import { QuoteResponseDto } from './dto/quote-response.dto.js';
import { ListQuotesQueryDto } from './dto/list-quotes-query.dto.js';
import { PaginatedResponseDto } from '../../../shared/pagination/paginated-response.dto.js';
import { ClientNotFoundError } from '../domain/errors/client-not-found.error.js';
import { QuoteNotFoundError } from '../domain/errors/quote-not-found.error.js';
import { InvalidQuoteStatusTransitionError } from '../domain/errors/invalid-quote-status-transition.error.js';
import { FileSizeExceededError } from '../../../shared/file-storage/domain/errors/file-size-exceeded.error.js';
import { InvalidFileTypeError } from '../../../shared/file-storage/domain/errors/invalid-file-type.error.js';
import { CurrentAdvisorProvider } from '../../../shared/auth/domain/current-advisor.provider.js';
import { CurrentActorProvider } from '../../../shared/auth/domain/current-actor.provider.js';
import { queryValidationPipe } from '../../../shared/pagination/query-validation.pipe.js';

interface UploadedFilePayload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@ApiTags('Quotes')
@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly createQuoteUseCase: CreateQuoteUseCase,
    private readonly getQuoteByIdUseCase: GetQuoteByIdUseCase,
    private readonly attachQuoteDocumentUseCase: AttachQuoteDocumentUseCase,
    private readonly changeQuoteStatusUseCase: ChangeQuoteStatusUseCase,
    private readonly listQuotesUseCase: ListQuotesUseCase,
    private readonly currentAdvisor: CurrentAdvisorProvider,
    private readonly currentActor: CurrentActorProvider,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quote with products (HU-30)' })
  @ApiResponse({
    status: 201,
    description:
      'Quote created successfully with calculated totals and consecutive number',
    type: QuoteResponseDto,
  })
  async create(
    @Body() dto: CreateQuoteDto,
    @Req() request: Request,
  ): Promise<QuoteResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);
    try {
      const quote = await this.createQuoteUseCase.execute({
        clientId: dto.clientId,
        advisorId,
        visitId: dto.visitId,
        notes: dto.notes,
        documentKey: dto.documentKey,
        items: dto.items,
      });
      return new QuoteResponseDto(quote);
    } catch (error) {
      if (error instanceof ClientNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Get()
  @ApiOperation({
    summary: 'List quotes with pagination and filters (HU-34)',
    description:
      'An advisor only sees their own quotes and a regional director only the quotes of clients in their zone (HU-06).',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of quotes matching filter criteria',
    type: PaginatedResponseDto<QuoteResponseDto>,
  })
  async list(
    @Query(queryValidationPipe()) query: ListQuotesQueryDto,
    @Req() request: Request,
  ): Promise<PaginatedResponseDto<QuoteResponseDto>> {
    const actor = await this.currentActor.extract(request);
    const result = await this.listQuotesUseCase.execute(
      {
        clientId: query.clientId,
        advisorId: query.advisorId,
        status: query.status,
        startDate: query.startDate,
        endDate: query.endDate,
        page: query.parsedPage,
        limit: query.parsedLimit,
      },
      actor,
    );

    return PaginatedResponseDto.create(
      result,
      (quote) => new QuoteResponseDto(quote),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quote details and attachment URL by ID' })
  @ApiResponse({
    status: 200,
    description: 'Quote details and line items with presigned document URL',
    type: QuoteResponseDto,
  })
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ): Promise<QuoteResponseDto> {
    const actor = await this.currentActor.extract(request);
    try {
      const result = await this.getQuoteByIdUseCase.execute(id, actor);
      return new QuoteResponseDto(result.quote, result.documentUrl);
    } catch (error) {
      if (error instanceof QuoteNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Post(':id/attachment')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Attach commercial support document or image to quote (HU-31)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Commercial document or image (PDF, PNG, JPG, WebP) max 10MB',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Document uploaded to S3, attached to quote, and presigned URL returned',
    type: QuoteResponseDto,
  })
  async attachDocument(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
    @UploadedFile() file?: UploadedFilePayload,
  ): Promise<QuoteResponseDto> {
    if (!file) {
      throw new BadRequestException('A file is required.');
    }

    const actor = await this.currentActor.extract(request);
    try {
      const result = await this.attachQuoteDocumentUseCase.execute(
        id,
        {
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
        actor,
      );
      return new QuoteResponseDto(result.quote, result.documentUrl);
    } catch (error) {
      if (error instanceof QuoteNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof FileSizeExceededError ||
        error instanceof InvalidFileTypeError
      ) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Patch(':id/status')
  @ApiOperation({
    summary:
      'Change quote status (DRAFT -> SENT -> APPROVED/REJECTED) with activity log (HU-32)',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote status updated and audited in activity log',
    type: QuoteResponseDto,
  })
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeQuoteStatusDto,
    @Req() request: Request,
  ): Promise<QuoteResponseDto> {
    const actorId = await this.currentAdvisor.extract(request);
    const actor = await this.currentActor.extract(request);

    try {
      const updatedQuote = await this.changeQuoteStatusUseCase.execute({
        quoteId: id,
        newStatus: dto.status,
        actorId,
        actor,
      });
      return new QuoteResponseDto(updatedQuote);
    } catch (error) {
      if (error instanceof QuoteNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof InvalidQuoteStatusTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
