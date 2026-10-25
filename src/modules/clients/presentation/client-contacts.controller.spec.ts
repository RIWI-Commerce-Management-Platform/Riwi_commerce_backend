import { describe, expect, it, vi } from 'vitest';
import { ClientContactsController } from './client-contacts.controller.js';
import { ClientContact } from '../domain/client-contact.entity.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { ClientContactNotFoundError } from '../domain/client-contact-not-found.error.js';
import { CreateClientContactUseCase } from '../application/create-client-contact.use-case.js';
import { UpdateClientContactUseCase } from '../application/update-client-contact.use-case.js';
import { ListClientContactsUseCase } from '../application/list-client-contacts.use-case.js';
import { SetPrimaryContactUseCase } from '../application/set-primary-contact.use-case.js';
import { DeleteClientContactUseCase } from '../application/delete-client-contact.use-case.js';
import { NotFoundException } from '@nestjs/common';

describe('ClientContactsController', () => {
  const createMockContact = (id = 1, isPrimary = false): ClientContact =>
    new ClientContact({
      id,
      clientId: 10,
      name: 'Carlos Mendoza',
      position: 'Gerente Comercial',
      phone: '+576053001122',
      mobile: '+573009876543',
      email: 'carlos@empresa.com',
      isPrimary,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const setup = () => {
    const createUseCase = {
      execute: vi.fn(),
    } as unknown as CreateClientContactUseCase;

    const updateUseCase = {
      execute: vi.fn(),
    } as unknown as UpdateClientContactUseCase;

    const listUseCase = {
      execute: vi.fn(),
    } as unknown as ListClientContactsUseCase;

    const setPrimaryUseCase = {
      execute: vi.fn(),
    } as unknown as SetPrimaryContactUseCase;

    const deleteUseCase = {
      execute: vi.fn(),
    } as unknown as DeleteClientContactUseCase;

    const controller = new ClientContactsController(
      createUseCase,
      updateUseCase,
      listUseCase,
      setPrimaryUseCase,
      deleteUseCase,
    );

    return {
      controller,
      createUseCase,
      updateUseCase,
      listUseCase,
      setPrimaryUseCase,
      deleteUseCase,
    };
  };

  it('should create a contact successfully', async () => {
    const { controller, createUseCase } = setup();
    const contact = createMockContact(1, true);
    vi.mocked(createUseCase.execute).mockResolvedValue(contact);

    const result = await controller.create(10, {
      name: 'Carlos Mendoza',
      position: 'Gerente Comercial',
      phone: '+576053001122',
      mobile: '+573009876543',
      email: 'carlos@empresa.com',
      isPrimary: true,
    });

    expect(result.id).toBe(1);
    expect(result.clientId).toBe(10);
    expect(result.isPrimary).toBe(true);
  });

  it('should throw NotFoundException on create when client not found', async () => {
    const { controller, createUseCase } = setup();
    vi.mocked(createUseCase.execute).mockRejectedValue(
      new ClientNotFoundError(999),
    );

    await expect(
      controller.create(999, {
        name: 'Carlos',
        position: 'Gerente',
        phone: '1',
        mobile: '2',
        email: 'c@c.com',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should list contacts for client', async () => {
    const { controller, listUseCase } = setup();
    vi.mocked(listUseCase.execute).mockResolvedValue([
      createMockContact(1, true),
      createMockContact(2, false),
    ]);

    const result = await controller.list(10);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });

  it('should throw NotFoundException on list when client not found', async () => {
    const { controller, listUseCase } = setup();
    vi.mocked(listUseCase.execute).mockRejectedValue(
      new ClientNotFoundError(999),
    );

    await expect(controller.list(999)).rejects.toThrow(NotFoundException);
  });

  it('should update a contact successfully', async () => {
    const { controller, updateUseCase } = setup();
    const contact = createMockContact(1, false);
    contact.name = 'Updated Name';
    vi.mocked(updateUseCase.execute).mockResolvedValue(contact);

    const result = await controller.update(10, 1, { name: 'Updated Name' });
    expect(result.name).toBe('Updated Name');
  });

  it('should throw NotFoundException on update when client or contact not found', async () => {
    const { controller, updateUseCase } = setup();
    vi.mocked(updateUseCase.execute).mockRejectedValueOnce(
      new ClientNotFoundError(10),
    );

    await expect(controller.update(10, 1, { name: 'X' })).rejects.toThrow(
      NotFoundException,
    );

    vi.mocked(updateUseCase.execute).mockRejectedValueOnce(
      new ClientContactNotFoundError(1),
    );

    await expect(controller.update(10, 1, { name: 'X' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should set primary contact successfully', async () => {
    const { controller, setPrimaryUseCase } = setup();
    const contact = createMockContact(1, true);
    vi.mocked(setPrimaryUseCase.execute).mockResolvedValue(contact);

    const result = await controller.setPrimary(10, 1);
    expect(result.isPrimary).toBe(true);
  });

  it('should throw NotFoundException on setPrimary when contact not found', async () => {
    const { controller, setPrimaryUseCase } = setup();
    vi.mocked(setPrimaryUseCase.execute).mockRejectedValue(
      new ClientContactNotFoundError(999),
    );

    await expect(controller.setPrimary(10, 999)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should delete (soft delete) contact successfully', async () => {
    const { controller, deleteUseCase } = setup();
    const contact = createMockContact(1, false);
    contact.isActive = false;
    vi.mocked(deleteUseCase.execute).mockResolvedValue(contact);

    const result = await controller.delete(10, 1);
    expect(result.isActive).toBe(false);
  });

  it('should throw NotFoundException on delete when contact not found', async () => {
    const { controller, deleteUseCase } = setup();
    vi.mocked(deleteUseCase.execute).mockRejectedValue(
      new ClientContactNotFoundError(999),
    );

    await expect(controller.delete(10, 999)).rejects.toThrow(NotFoundException);
  });

  it('should rethrow unexpected errors', async () => {
    const {
      controller,
      createUseCase,
      listUseCase,
      updateUseCase,
      setPrimaryUseCase,
      deleteUseCase,
    } = setup();
    const err = new Error('Database crash');

    vi.mocked(createUseCase.execute).mockRejectedValueOnce(err);
    await expect(controller.create(1, {} as any)).rejects.toThrow(err);

    vi.mocked(listUseCase.execute).mockRejectedValueOnce(err);
    await expect(controller.list(1)).rejects.toThrow(err);

    vi.mocked(updateUseCase.execute).mockRejectedValueOnce(err);
    await expect(controller.update(1, 1, {} as any)).rejects.toThrow(err);

    vi.mocked(setPrimaryUseCase.execute).mockRejectedValueOnce(err);
    await expect(controller.setPrimary(1, 1)).rejects.toThrow(err);

    vi.mocked(deleteUseCase.execute).mockRejectedValueOnce(err);
    await expect(controller.delete(1, 1)).rejects.toThrow(err);
  });
});
