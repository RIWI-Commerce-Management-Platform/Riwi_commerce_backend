import { describe, expect, it } from 'vitest';
import {
  AdvisorAccountCreationError,
  AdvisorEmailAlreadyExistsError,
  AdvisorNotFoundError,
  AdvisorZoneNotFoundError,
} from './advisor.errors.js';

describe('advisor errors', () => {
  it.each([
    [new AdvisorNotFoundError(4), 'AdvisorNotFoundError', '"4"'],
    [
      new AdvisorEmailAlreadyExistsError('ana@riwi.com'),
      'AdvisorEmailAlreadyExistsError',
      'ana@riwi.com',
    ],
    [new AdvisorZoneNotFoundError(9), 'AdvisorZoneNotFoundError', '"9"'],
    [
      new AdvisorAccountCreationError('Email taken'),
      'AdvisorAccountCreationError',
      'Email taken',
    ],
  ])('%s has its name and message', (error, name, fragment) => {
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe(name);
    expect(error.message).toContain(fragment);
  });

  it('uses a default message when the account creation has no reason', () => {
    expect(new AdvisorAccountCreationError().message).toBe(
      'The advisor account could not be created',
    );
  });
});
