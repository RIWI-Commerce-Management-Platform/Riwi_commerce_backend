import { describe, expect, it } from 'vitest';

import {
  Visit,
  VisitStatus,
  MAX_VISIT_OBSERVATIONS_LENGTH,
} from './visit.entity.js';

import { InvalidVisitStatusError } from './errors/invalid-visit-status.error.js';

import { InvalidVisitObservationsError } from './errors/invalid-visit-observations.error.js';

import { EmptyVisitResultsError } from './errors/empty-visit-results.error.js';

import { InvalidVisitScheduledAtError } from './errors/invalid-visit-scheduled-at.error.js';

function buildVisit(overrides: Partial<ConstructorParameters<typeof Visit>[0]> = {}) {
  return new Visit({
    id: 1,
    clientId: 10,
    advisorId: 20,
    routeId: null,
    scheduledAt: new Date(2026, 9, 20, 9, 0, 0),
    actualDate: null,
    startTime: null,
    endTime: null,
    status: VisitStatus.PENDING,
    objective: 'Presentar catalogo',
    ...overrides,
  });
}

describe('Visit (domain entity)', () => {
  it('starts a pending visit and sets actual date and start time', () => {
    const base = buildVisit();
    expect(base.advisorId).toBe(20);
    const started = base.start();

    expect(started.status).toBe(VisitStatus.IN_PROGRESS);
    expect(started.actualDate).toBeInstanceOf(Date);
    expect(started.startTime).toMatch(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/);
  });

  it('rejects starting a visit that is not pending', () => {
    const visit = buildVisit({ status: VisitStatus.IN_PROGRESS });

    expect(() => visit.start()).toThrow(InvalidVisitStatusError);
  });

  it('rejects starting an already visited visit', () => {
    const visit = buildVisit({ status: VisitStatus.VISITED });

    expect(() => visit.start()).toThrow(InvalidVisitStatusError);
  });

  it('starts a rescheduled visit without changing its scheduled date', () => {
    const scheduledAt = new Date(2026, 9, 22, 14, 30, 0);
    const visit = buildVisit({
      status: VisitStatus.RESCHEDULE,
      scheduledAt,
    });

    const started = visit.start();

    expect(started.status).toBe(VisitStatus.IN_PROGRESS);
    expect(started.scheduledAt).toEqual(scheduledAt);
  });

  it('reschedules a pending visit and preserves actual visit fields', () => {
    const visit = buildVisit({
      actualDate: new Date(2026, 9, 19),
      startTime: '08:00:00',
      endTime: '08:30:00',
      observations: 'Existing observation',
      results: [{ id: 1, name: 'Existing result' }],
    });
    const scheduledAt = new Date(2026, 9, 22, 14, 30, 0);

    const rescheduled = visit.reschedule(scheduledAt);

    expect(rescheduled.status).toBe(VisitStatus.RESCHEDULE);
    expect(rescheduled.scheduledAt).toBe(scheduledAt);
    expect(rescheduled.actualDate).toEqual(visit.actualDate);
    expect(rescheduled.startTime).toBe(visit.startTime);
    expect(rescheduled.endTime).toBe(visit.endTime);
    expect(rescheduled.observations).toBe(visit.observations);
    expect(rescheduled.results).toEqual(visit.results);
  });

  it('rejects an invalid scheduled date', () => {
    expect(() => buildVisit().reschedule(new Date('invalid'))).toThrow(
      InvalidVisitScheduledAtError,
    );
  });

  it('rejects rescheduling a visit that has started or been completed', () => {
    expect(() =>
      buildVisit({ status: VisitStatus.IN_PROGRESS }).reschedule(new Date()),
    ).toThrow(InvalidVisitStatusError);
    expect(() =>
      buildVisit({ status: VisitStatus.VISITED }).reschedule(new Date()),
    ).toThrow(InvalidVisitStatusError);
  });

  it('marks a non-completed visit as not visited without changing its history', () => {
    const actualDate = new Date(2026, 9, 20);
    const visit = buildVisit({
      status: VisitStatus.IN_PROGRESS,
      actualDate,
      startTime: '09:00:00',
      observations: 'Could not meet the client.',
    });

    const notVisited = visit.markNotVisited();

    expect(notVisited.status).toBe(VisitStatus.NOT_VISITED);
    expect(notVisited.actualDate).toBe(actualDate);
    expect(notVisited.startTime).toBe('09:00:00');
    expect(notVisited.observations).toBe('Could not meet the client.');
  });

  it('rejects marking a completed or already not-visited visit again', () => {
    expect(() =>
      buildVisit({ status: VisitStatus.VISITED }).markNotVisited(),
    ).toThrow(InvalidVisitStatusError);
    expect(() =>
      buildVisit({ status: VisitStatus.NOT_VISITED }).markNotVisited(),
    ).toThrow(InvalidVisitStatusError);
  });

  it('registers a result and moves an in-progress visit to VISITED', () => {
    const visit = buildVisit({
      status: VisitStatus.IN_PROGRESS,
      actualDate: new Date(2026, 9, 20),
      startTime: '09:00:00',
    });

    const completed = visit.registerResult({
      endTime: '10:30:00',
      observations: 'Cliente interesado.',
      results: [{ id: 1, name: 'Visita realizada' }],
    });

    expect(completed.status).toBe(VisitStatus.VISITED);
    expect(completed.endTime).toBe('10:30:00');
    expect(completed.observations).toBe('Cliente interesado.');
    expect(completed.results).toHaveLength(1);
    expect(completed.results[0].name).toBe('Visita realizada');
  });

  it('rejects registering a result when the visit is not in progress', () => {
    const visit = buildVisit();

    expect(() =>
      visit.registerResult({
        endTime: '10:30:00',
        observations: 'obs',
        results: [{ id: 1, name: 'Visita realizada' }],
      }),
    ).toThrow(InvalidVisitStatusError);
  });

  it('rejects registering a result with an empty results list', () => {
    const visit = buildVisit({ status: VisitStatus.IN_PROGRESS });

    expect(() =>
      visit.registerResult({
        endTime: '10:30:00',
        observations: 'obs',
        results: [],
      }),
    ).toThrow(EmptyVisitResultsError);
  });

  it('rejects observations longer than 500 characters', () => {
    const visit = buildVisit({ status: VisitStatus.IN_PROGRESS });
    const observations = 'x'.repeat(MAX_VISIT_OBSERVATIONS_LENGTH + 1);

    expect(() =>
      visit.registerResult({
        endTime: '10:30:00',
        observations,
        results: [{ id: 1, name: 'Visita realizada' }],
      }),
    ).toThrow(InvalidVisitObservationsError);
  });

  it('accepts observations of exactly 500 characters', () => {
    const visit = buildVisit({ status: VisitStatus.IN_PROGRESS });
    const observations = 'x'.repeat(MAX_VISIT_OBSERVATIONS_LENGTH);

    const completed = visit.registerResult({
      endTime: '10:30:00',
      observations,
      results: [{ id: 1, name: 'Visita realizada' }],
    });

    expect(completed.observations).toHaveLength(500);
  });
});
