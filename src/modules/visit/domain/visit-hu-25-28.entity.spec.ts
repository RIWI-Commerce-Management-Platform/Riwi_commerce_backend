import { describe, expect, it } from 'vitest';

import { Visit, VisitStatus } from './visit.entity.js';

import { FollowUp, FollowUpStatus } from './follow-up.entity.js';

import { VisitAttachment } from './visit-attachment.entity.js';

import { InvalidVisitStatusError } from './errors/invalid-visit-status.error.js';

import { InvalidVisitRescheduleDateError } from './errors/invalid-visit-reschedule-date.error.js';

import { InvalidVisitObservationsError } from './errors/invalid-visit-observations.error.js';

import { InvalidFollowUpError } from './errors/invalid-follow-up.error.js';

const now = new Date(2026, 9, 20, 8, 0, 0);

function buildVisit(status: VisitStatus = VisitStatus.PENDING) {
  return new Visit({
    id: 1,
    clientId: 10,
    advisorId: 20,
    routeId: null,
    scheduledAt: new Date(2026, 9, 20, 9, 0, 0),
    actualDate: null,
    startTime: null,
    endTime: null,
    status,
    objective: null,
  });
}

describe('Visit rescheduling and not-visited (HU-26)', () => {
  it('moves a pending visit to a future date', () => {
    const newDate = new Date(2026, 9, 22, 10, 0, 0);
    const visit = buildVisit().reschedule(newDate, 'Client asked', now);

    expect(visit.status).toBe(VisitStatus.RESCHEDULE);
    expect(visit.scheduledAt).toBe(newDate);
    expect(visit.observations).toBe('Client asked');
  });

  it('lets a rescheduled visit be rescheduled again and started', () => {
    const visit = buildVisit(VisitStatus.RESCHEDULE);

    expect(visit.reschedule(new Date(2026, 9, 23), undefined, now).status).toBe(
      VisitStatus.RESCHEDULE,
    );
    expect(visit.start().status).toBe(VisitStatus.IN_PROGRESS);
  });

  it('rejects a date in the past', () => {
    expect(() =>
      buildVisit().reschedule(new Date(2026, 9, 19), undefined, now),
    ).toThrow(InvalidVisitRescheduleDateError);
  });

  it('rejects rescheduling a visit that already happened', () => {
    expect(() =>
      buildVisit(VisitStatus.VISITED).reschedule(
        new Date(2026, 9, 22),
        undefined,
        now,
      ),
    ).toThrow(InvalidVisitStatusError);
  });

  it('rejects a reason over 500 characters', () => {
    expect(() =>
      buildVisit().reschedule(new Date(2026, 9, 22), 'x'.repeat(501), now),
    ).toThrow(InvalidVisitObservationsError);
  });

  it('marks pending and in-progress visits as not visited', () => {
    expect(buildVisit().markNotVisited('Closed').status).toBe(
      VisitStatus.NOT_VISITED,
    );
    expect(buildVisit(VisitStatus.IN_PROGRESS).markNotVisited().status).toBe(
      VisitStatus.NOT_VISITED,
    );
  });

  it('rejects marking a done visit as not visited', () => {
    expect(() => buildVisit(VisitStatus.VISITED).markNotVisited()).toThrow(
      InvalidVisitStatusError,
    );
  });
});

describe('Visit commercial outcome (HU-27)', () => {
  it('records the outcome of a visit in progress or done', () => {
    const outcome = { quoteGenerated: true, orderGenerated: false };

    const inProgress = buildVisit(
      VisitStatus.IN_PROGRESS,
    ).registerCommercialOutcome(outcome);
    const visited = buildVisit(VisitStatus.VISITED).registerCommercialOutcome(
      outcome,
    );

    expect(inProgress.quoteGenerated).toBe(true);
    expect(visited.orderGenerated).toBe(false);
  });

  it('rejects the outcome of a visit that has not started', () => {
    expect(() =>
      buildVisit().registerCommercialOutcome({
        quoteGenerated: true,
        orderGenerated: true,
      }),
    ).toThrow(InvalidVisitStatusError);
  });

  it('defaults to no quote and no order', () => {
    expect(buildVisit().quoteGenerated).toBe(false);
    expect(buildVisit().orderGenerated).toBe(false);
  });
});

describe('FollowUp (HU-25)', () => {
  const base = {
    visitId: 1,
    clientId: 10,
    responsibleId: 20,
    createdById: 20,
    dueDate: new Date(2026, 9, 25),
    activity: '  Call to confirm  ',
    observation: null,
  };

  it('is scheduled as pending with a trimmed activity', () => {
    const followUp = FollowUp.schedule(base);

    expect(followUp.status).toBe(FollowUpStatus.PENDING);
    expect(followUp.activity).toBe('Call to confirm');
    expect(followUp.completedAt).toBeNull();
  });

  it('is completed once', () => {
    const completed = FollowUp.schedule(base).complete(now);

    expect(completed.status).toBe(FollowUpStatus.COMPLETED);
    expect(completed.completedAt).toBe(now);
    expect(() => completed.complete()).toThrow(InvalidFollowUpError);
  });

  it.each([
    ['an empty activity', { activity: '  ' }],
    ['a long activity', { activity: 'x'.repeat(151) }],
    ['a long observation', { observation: 'x'.repeat(501) }],
    ['an invalid date', { dueDate: new Date('nope') }],
  ])('rejects %s', (_label, overrides) => {
    expect(() => FollowUp.schedule({ ...base, ...overrides })).toThrow(
      InvalidFollowUpError,
    );
  });

  it('carries the client name for the agenda', () => {
    expect(FollowUp.schedule(base).withClientName('Tienda').clientName).toBe(
      'Tienda',
    );
  });
});

describe('VisitAttachment (HU-28)', () => {
  it('tells images apart from documents', () => {
    const build = (mimeType: string) =>
      new VisitAttachment({
        visitId: 1,
        fileKey: 'visits/1/a',
        originalName: 'a',
        mimeType,
        size: 10,
        uploadedById: 20,
      });

    expect(build('image/png').isImage).toBe(true);
    expect(build('application/pdf').isImage).toBe(false);
  });
});
