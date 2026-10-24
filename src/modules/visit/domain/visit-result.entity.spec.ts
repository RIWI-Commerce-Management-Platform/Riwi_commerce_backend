import { describe, expect, it } from 'vitest';
import { VisitResultOption } from './visit-result.entity.js';
import { InvalidVisitStatusError } from './errors/invalid-visit-status.error.js';
import { VisitStatus } from './visit.entity.js';

describe('Visit Domain Entities and Errors', () => {
  it('VisitResultOption should expose getters and toJSON', () => {
    const option = new VisitResultOption({
      id: 1,
      name: 'Venta Realizada',
      isActive: true,
    });

    expect(option.id).toBe(1);
    expect(option.name).toBe('Venta Realizada');
    expect(option.isActive).toBe(true);
    expect(option.toJSON()).toEqual({
      id: 1,
      name: 'Venta Realizada',
      isActive: true,
    });
  });

  it('InvalidVisitStatusError should expose getters', () => {
    const error = new InvalidVisitStatusError(VisitStatus.VISITED, 'start');
    expect(error.currentStatus).toBe(VisitStatus.VISITED);
    expect(error.attemptedAction).toBe('start');
    expect(error.message).toContain('cannot be start');
  });
});
