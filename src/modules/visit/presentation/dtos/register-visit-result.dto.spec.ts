import { describe, expect, it } from 'vitest';

import { plainToInstance } from 'class-transformer';

import { validate } from 'class-validator';

import { RegisterVisitResultDto } from './register-visit-result.dto.js';

async function validateDto(payload: unknown) {
  const dto = plainToInstance(RegisterVisitResultDto, payload);
  return validate(dto);
}

describe('RegisterVisitResultDto', () => {
  it('accepts a valid payload', async () => {
    const errors = await validateDto({
      endTime: '16:30:00',
      observations: 'Interested client.',
      results: [{ id: 1 }, { id: 2, observation: 'Con seguimiento' }],
    });

    expect(errors).toHaveLength(0);
  });

  it('accepts endTime without seconds', async () => {
    const errors = await validateDto({
      endTime: '16:30',
      observations: 'obs',
      results: [{ id: 1 }],
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid endTime format', async () => {
    const errors = await validateDto({
      endTime: '25:00',
      observations: 'obs',
      results: [{ id: 1 }],
    });

    expect(errors.some((error) => error.property === 'endTime')).toBe(true);
  });

  it('rejects observations longer than 500 characters', async () => {
    const errors = await validateDto({
      endTime: '16:30:00',
      observations: 'x'.repeat(501),
      results: [{ id: 1 }],
    });

    expect(errors.some((error) => error.property === 'observations')).toBe(
      true,
    );
  });

  it('rejects an empty results list', async () => {
    const errors = await validateDto({
      endTime: '16:30:00',
      observations: 'obs',
      results: [],
    });

    expect(errors.some((error) => error.property === 'results')).toBe(true);
  });

  it('rejects missing results', async () => {
    const errors = await validateDto({
      endTime: '16:30:00',
      observations: 'obs',
    });

    expect(errors.some((error) => error.property === 'results')).toBe(true);
  });

  it('rejects a result id that is not an integer', async () => {
    const errors = await validateDto({
      endTime: '16:30:00',
      observations: 'obs',
      results: [{ id: 'abc' }],
    });

    const serialized = JSON.stringify(errors);

    expect(serialized).toContain('id');
    expect(serialized).toContain('isInt');
  });

  it('rejects a per-result observation longer than 500 characters', async () => {
    const errors = await validateDto({
      endTime: '16:30:00',
      observations: 'obs',
      results: [{ id: 1, observation: 'x'.repeat(501) }],
    });

    const serialized = JSON.stringify(errors);

    expect(serialized).toContain('observation');
    expect(serialized).toContain('maxLength');
  });
});
