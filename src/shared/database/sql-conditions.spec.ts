import { describe, expect, it } from 'vitest';
import { SqlConditions } from './sql-conditions.js';

describe('SqlConditions', () => {
  it('numbers the parameters and skips undefined values', () => {
    const conditions = new SqlConditions()
      .add('a = ?', 1)
      .add('b = ?', undefined)
      .add('c >= ?', 'x');

    expect(conditions.where()).toBe('WHERE a = $1 AND c >= $2');
    expect(conditions.and()).toBe('AND a = $1 AND c >= $2');
    expect(conditions.params).toEqual([1, 'x']);
  });

  it('continues after initial parameters', () => {
    const conditions = new SqlConditions(['start', 'end']).add('z = ?', 3);
    expect(conditions.clause).toBe('z = $3');
  });

  it('reuses the value for every placeholder of a condition', () => {
    const conditions = new SqlConditions().add('(a LIKE ? OR b LIKE ?)', '%x%');
    expect(conditions.clause).toBe('(a LIKE $1 OR b LIKE $1)');
    expect(conditions.params).toEqual(['%x%']);
  });

  it('is empty without conditions', () => {
    const conditions = new SqlConditions();
    expect(conditions.where()).toBe('');
    expect(conditions.and()).toBe('');
  });
});
