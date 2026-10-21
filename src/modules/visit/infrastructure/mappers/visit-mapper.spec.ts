import { describe, expect, it } from 'vitest';

import { VisitMapper } from './visit-mapper.js';

import { VisitOrmEntity } from '../visit.orm-entity.js';

import type { VisitResultLinkShape } from '../visit.orm-entity.js';

import { Visit, VisitStatus } from '../../domain/visit.entity.js';

function buildOrmEntity(
  overrides: Partial<VisitOrmEntity> = {},
): VisitOrmEntity {
  const entity = new VisitOrmEntity();
  entity.id = 1;
  entity.clientId = 10;
  entity.advisorId = 20;
  entity.routeId = null;
  entity.scheduledAt = new Date(2026, 9, 20, 9, 0, 0);
  entity.actualDate = null;
  entity.startTime = null;
  entity.endTime = null;
  entity.status = VisitStatus.PENDING;
  entity.objective = 'Presentar catalogo';
  entity.observations = null;
  Object.assign(entity, overrides);
  return entity;
}

function buildLink(
  resultId: number,
  name: string,
  observation: string | null = null,
): VisitResultLinkShape {
  return {
    resultId,
    observation,
    resultOption: { name },
  };
}

describe('VisitMapper', () => {
  it('maps a persisted visit to the domain', () => {
    const domain = VisitMapper.toDomain(buildOrmEntity());

    expect(domain).toBeInstanceOf(Visit);
    expect(domain.id).toBe(1);
    expect(domain.status).toBe(VisitStatus.PENDING);
    expect(domain.scheduledAt).toEqual(new Date(2026, 9, 20, 9, 0, 0));
  });

  it('maps persisted result links into domain results', () => {
    const entity = buildOrmEntity({
      status: VisitStatus.VISITED,
      actualDate: new Date(2026, 9, 20),
      startTime: '09:00:00',
      endTime: '10:30:00',
      observations: 'Cliente interesado.',
    });
    entity.resultLinks = [
      buildLink(1, 'Visita realizada'),
      buildLink(2, 'Pedido capturado', 'Descuento del 10%'),
    ];

    const domain = VisitMapper.toDomain(entity);

    expect(domain.results).toEqual([
      { id: 1, name: 'Visita realizada', observation: undefined },
      { id: 2, name: 'Pedido capturado', observation: 'Descuento del 10%' },
    ]);
    expect(domain.observations).toBe('Cliente interesado.');
  });

  it('maps a visit without result links to an empty results list', () => {
    const entity = buildOrmEntity();
    entity.resultLinks = [];

    const domain = VisitMapper.toDomain(entity);

    expect(domain.results).toEqual([]);
  });

  it('maps a domain visit back to the persistence entity', () => {
    const domain = new Visit({
      id: 1,
      clientId: 10,
      advisorId: 20,
      routeId: 3,
      scheduledAt: new Date(2026, 9, 20, 9, 0, 0),
      actualDate: new Date(2026, 9, 20),
      startTime: '09:00:00',
      endTime: '10:30:00',
      status: VisitStatus.VISITED,
      objective: 'Presentar catalogo',
      observations: 'obs',
      results: [{ id: 1, name: 'Visita realizada' }],
    });

    const entity = VisitMapper.toPersistence(domain);

    expect(entity).toBeInstanceOf(VisitOrmEntity);
    expect(entity.id).toBe(1);
    expect(entity.clientId).toBe(10);
    expect(entity.routeId).toBe(3);
    expect(entity.status).toBe(VisitStatus.VISITED);
    expect(entity.observations).toBe('obs');
  });
});
