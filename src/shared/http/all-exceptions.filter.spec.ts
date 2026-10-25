import { describe, expect, it, vi } from 'vitest';
import {
  BadRequestException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

class ClientNotFoundError extends Error {
  constructor() {
    super('Client not found');
    this.name = 'ClientNotFoundError';
  }
}

class RouteNameAlreadyExistsError extends Error {
  constructor() {
    super('Route exists');
    this.name = 'RouteNameAlreadyExistsError';
  }
}

class InvalidStopOrderError extends Error {
  constructor() {
    super('Bad order');
    this.name = 'InvalidStopOrderError';
  }
}

const run = (exception: unknown) => {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method: 'GET', url: '/clients/1' }),
    }),
  };
  new AllExceptionsFilter().catch(exception, host as any);
  return { status, body: json.mock.calls[0][0] };
};

describe('AllExceptionsFilter', () => {
  it('keeps the status and validation messages of HTTP exceptions', () => {
    const { status, body } = run(
      new BadRequestException(['name should not be empty']),
    );
    expect(status).toHaveBeenCalledWith(400);
    expect(body).toMatchObject({
      statusCode: 400,
      error: 'BAD_REQUEST',
      message: ['name should not be empty'],
      path: '/clients/1',
    });
    expect(typeof body.timestamp).toBe('string');
  });

  it('keeps a plain HTTP exception message', () => {
    const { body } = run(new NotFoundException('Visit not found.'));
    expect(body).toMatchObject({
      statusCode: 404,
      message: 'Visit not found.',
    });
  });

  it.each([
    [new ClientNotFoundError(), 404],
    [new RouteNameAlreadyExistsError(), 409],
    [new InvalidStopOrderError(), 400],
  ])('maps the unmapped domain error %s by name', (error, expected) => {
    const { status, body } = run(error);
    expect(status).toHaveBeenCalledWith(expected);
    expect(body.message).toBe(error.message);
  });

  it('hides unexpected errors behind a 500', () => {
    const { status, body } = run(new Error('connection string leaked'));
    expect(status).toHaveBeenCalledWith(500);
    expect(body.message).toBe('Internal server error');
  });

  it('hides a thrown value that is not an Error behind a 500', () => {
    const { status, body } = run('plain string');
    expect(status).toHaveBeenCalledWith(500);
    expect(body.error).toBe('INTERNAL_SERVER_ERROR');
  });

  it('uses the exception message when the payload is a string', () => {
    const { status, body } = run(new HttpException('Teapot here', 418));
    expect(status).toHaveBeenCalledWith(418);
    expect(body.message).toBe('Teapot here');
    expect(body.error).toBe('I_AM_A_TEAPOT');
  });

  it('falls back to a generic error name for unknown status codes', () => {
    const { body } = run(new HttpException({ message: 'Odd' }, 599));
    expect(body).toMatchObject({
      statusCode: 599,
      error: 'Error',
      message: 'Odd',
    });
  });
});
