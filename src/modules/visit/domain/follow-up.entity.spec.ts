import { describe, expect, it } from 'vitest';
import { FollowUp, FollowUpStatus } from './follow-up.entity.js';
import { InvalidFollowUpError } from './errors/invalid-follow-up.error.js';

describe('FollowUp', () => {
  const props = {
    id: 3,
    visitId: 1,
    clientId: 10,
    responsibleId: 20,
    createdById: 20,
    dueDate: new Date('2026-10-27'),
    activity: 'Call back',
    observation: null,
    status: FollowUpStatus.PENDING,
    completedAt: null,
    createdAt: new Date('2026-10-20'),
  };

  it('exposes when it was created', () => {
    expect(new FollowUp(props).createdAt).toEqual(new Date('2026-10-20'));
  });

  it('requires an activity even when it is missing', () => {
    expect(
      () =>
        new FollowUp({ ...props, activity: undefined as unknown as string }),
    ).toThrow(InvalidFollowUpError);
  });
});
