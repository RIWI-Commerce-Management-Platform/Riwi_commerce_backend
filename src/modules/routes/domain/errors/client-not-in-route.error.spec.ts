import { describe, expect, it } from 'vitest';
import { ClientNotInRouteError } from './client-not-in-route.error.js';

describe('ClientNotInRouteError', () => {
  it('names the route when it is known', () => {
    const error = new ClientNotInRouteError(4, 9);

    expect(error.name).toBe('ClientNotInRouteError');
    expect(error.message).toBe('Client with id 4 was not found in route 9');
  });

  it('omits the route when it is not known', () => {
    expect(new ClientNotInRouteError(4).message).toBe(
      'Client with id 4 was not found',
    );
  });
});
