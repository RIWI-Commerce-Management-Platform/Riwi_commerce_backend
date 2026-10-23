import { describe, expect, it } from 'vitest';
import { RouteStop } from './route-stop.entity.js';

describe('RouteStop Domain Entity', () => {
  it('should instantiate a route stop with default values', () => {
    const stop = new RouteStop({
      clientId: 10,
      visitOrder: 1,
    });

    expect(stop.clientId).toBe(10);
    expect(stop.visitOrder).toBe(1);
    expect(stop.suggestedTime).toBeNull();
    expect(stop.estimatedDurationMinutes).toBe(30);
    expect(stop.createdAt).toBeInstanceOf(Date);
  });

  it('should instantiate with explicit custom values', () => {
    const stop = new RouteStop({
      id: 5,
      routeId: 2,
      clientId: 10,
      visitOrder: 3,
      suggestedTime: '10:30:00',
      estimatedDurationMinutes: 45,
    });

    expect(stop.id).toBe(5);
    expect(stop.routeId).toBe(2);
    expect(stop.suggestedTime).toBe('10:30:00');
    expect(stop.estimatedDurationMinutes).toBe(45);
  });

  it('should throw an error if visitOrder is less than 1', () => {
    expect(() => {
      new RouteStop({
        clientId: 10,
        visitOrder: 0,
      });
    }).toThrow('visitOrder must be greater than or equal to 1');
  });

  it('should allow changing order to a valid value', () => {
    const stop = new RouteStop({
      clientId: 10,
      visitOrder: 1,
    });

    stop.changeOrder(2);
    expect(stop.visitOrder).toBe(2);
  });

  it('should throw if changing order to less than 1', () => {
    const stop = new RouteStop({
      clientId: 10,
      visitOrder: 1,
    });

    expect(() => stop.changeOrder(0)).toThrow(
      'visitOrder must be greater than or equal to 1',
    );
  });

  it('should update suggested time', () => {
    const stop = new RouteStop({
      clientId: 10,
      visitOrder: 1,
    });

    stop.updateSuggestedTime('14:00:00');
    expect(stop.suggestedTime).toBe('14:00:00');

    stop.updateSuggestedTime(null);
    expect(stop.suggestedTime).toBeNull();
  });

  it('should update estimated duration', () => {
    const stop = new RouteStop({
      clientId: 10,
      visitOrder: 1,
    });

    stop.updateEstimatedDuration(60);
    expect(stop.estimatedDurationMinutes).toBe(60);
  });

  it('should throw if estimated duration is 0 or negative', () => {
    const stop = new RouteStop({
      clientId: 10,
      visitOrder: 1,
    });

    expect(() => stop.updateEstimatedDuration(0)).toThrow(
      'estimatedDurationMinutes must be greater than 0',
    );
    expect(() => stop.updateEstimatedDuration(-10)).toThrow(
      'estimatedDurationMinutes must be greater than 0',
    );
  });
});
