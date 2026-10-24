import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateClientContactUseCase } from '../application/create-client-contact.use-case.js';
import { UpdateClientContactUseCase } from '../application/update-client-contact.use-case.js';
import { ListClientContactsUseCase } from '../application/list-client-contacts.use-case.js';
import { SetPrimaryContactUseCase } from '../application/set-primary-contact.use-case.js';
import { DeleteClientContactUseCase } from '../application/delete-client-contact.use-case.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { ClientContactNotFoundError } from '../domain/client-contact-not-found.error.js';
import { CreateClientContactDto } from './dto/create-client-contact.dto.js';
import { UpdateClientContactDto } from './dto/update-client-contact.dto.js';
import { ClientContactResponseDto } from './dto/client-contact-response.dto.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';

@ApiTags('Client Contacts')
@Controller('clients/:clientId/contacts')
export class ClientContactsController {
  constructor(
    private readonly createClientContactUseCase: CreateClientContactUseCase,
    private readonly updateClientContactUseCase: UpdateClientContactUseCase,
    private readonly listClientContactsUseCase: ListClientContactsUseCase,
    private readonly setPrimaryContactUseCase: SetPrimaryContactUseCase,
    private readonly deleteClientContactUseCase: DeleteClientContactUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new contact for a client',
    description:
      'Creates a contact person associated with a client. If marked as primary, any existing primary contact for the client will be demoted automatically.',
  })
  @ApiParam({ name: 'clientId', type: Number, example: 1 })
  @ApiBody({ type: CreateClientContactDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Contact created successfully.',
    type: ClientContactResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Client not found.' })
  async create(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Body() dto: CreateClientContactDto,
    @CurrentUser('id') actorId?: number,
  ): Promise<ClientContactResponseDto> {
    try {
      const contact = await this.createClientContactUseCase.execute({
        clientId,
        name: dto.name,
        position: dto.position,
        phone: dto.phone,
        mobile: dto.mobile,
        email: dto.email,
        isPrimary: dto.isPrimary,
        actorId,
      });

      return new ClientContactResponseDto(contact);
    } catch (error) {
      if (error instanceof ClientNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Get()
  @ApiOperation({
    summary: 'List all active contacts for a client',
    description:
      'Returns all active contacts for the given client, with the primary contact listed first.',
  })
  @ApiParam({ name: 'clientId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'List of contacts.',
    type: [ClientContactResponseDto],
  })
  @ApiNotFoundResponse({ description: 'Client not found.' })
  async list(
    @Param('clientId', ParseIntPipe) clientId: number,
  ): Promise<ClientContactResponseDto[]> {
    try {
      const contacts = await this.listClientContactsUseCase.execute(clientId);
      return contacts.map((c) => new ClientContactResponseDto(c));
    } catch (error) {
      if (error instanceof ClientNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Patch(':contactId')
  @ApiOperation({ summary: 'Update an existing client contact' })
  @ApiParam({ name: 'clientId', type: Number, example: 1 })
  @ApiParam({ name: 'contactId', type: Number, example: 1 })
  @ApiBody({ type: UpdateClientContactDto })
  @ApiOkResponse({
    description: 'Contact updated successfully.',
    type: ClientContactResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Contact or client not found.' })
  async update(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Param('contactId', ParseIntPipe) contactId: number,
    @Body() dto: UpdateClientContactDto,
    @CurrentUser('id') actorId?: number,
  ): Promise<ClientContactResponseDto> {
    try {
      const contact = await this.updateClientContactUseCase.execute({
        clientId,
        contactId,
        name: dto.name,
        position: dto.position,
        phone: dto.phone,
        mobile: dto.mobile,
        email: dto.email,
        isPrimary: dto.isPrimary,
        actorId,
      });

      return new ClientContactResponseDto(contact);
    } catch (error) {
      if (
        error instanceof ClientNotFoundError ||
        error instanceof ClientContactNotFoundError
      ) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Patch(':contactId/primary')
  @ApiOperation({
    summary: 'Designate contact as the primary contact for the client',
  })
  @ApiParam({ name: 'clientId', type: Number, example: 1 })
  @ApiParam({ name: 'contactId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Contact designated as primary.',
    type: ClientContactResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Contact or client not found.' })
  async setPrimary(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Param('contactId', ParseIntPipe) contactId: number,
    @CurrentUser('id') actorId?: number,
  ): Promise<ClientContactResponseDto> {
    try {
      const contact = await this.setPrimaryContactUseCase.execute({
        clientId,
        contactId,
        actorId,
      });

      return new ClientContactResponseDto(contact);
    } catch (error) {
      if (error instanceof ClientContactNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Delete(':contactId')
  @ApiOperation({ summary: 'Deactivate / soft delete a client contact' })
  @ApiParam({ name: 'clientId', type: Number, example: 1 })
  @ApiParam({ name: 'contactId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Contact deactivated successfully.',
    type: ClientContactResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Contact or client not found.' })
  async delete(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Param('contactId', ParseIntPipe) contactId: number,
    @CurrentUser('id') actorId?: number,
  ): Promise<ClientContactResponseDto> {
    try {
      const contact = await this.deleteClientContactUseCase.execute({
        clientId,
        contactId,
        actorId,
      });

      return new ClientContactResponseDto(contact);
    } catch (error) {
      if (error instanceof ClientContactNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
