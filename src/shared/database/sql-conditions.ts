/**
 * Builds a parameterized WHERE clause for raw read-only queries. Every `?`
 * in a condition refers to that condition's single value and becomes `$n`.
 */
export class SqlConditions {
  private readonly parts: string[] = [];
  readonly params: unknown[] = [];

  constructor(initialParams: unknown[] = []) {
    this.params.push(...initialParams);
  }

  /** Adds the condition only when the value is defined. */
  add(sql: string, value: unknown): this {
    if (value === undefined) {
      return this;
    }
    this.params.push(value);
    this.parts.push(sql.replaceAll('?', `$${this.params.length}`));
    return this;
  }

  get clause(): string {
    return this.parts.join(' AND ');
  }

  where(): string {
    return this.parts.length ? `WHERE ${this.clause}` : '';
  }

  /** Appends the conditions to an existing condition (e.g. in a JOIN). */
  and(): string {
    return this.parts.length ? `AND ${this.clause}` : '';
  }
}
