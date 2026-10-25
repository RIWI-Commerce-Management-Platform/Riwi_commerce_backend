import { describe, expect, it } from 'vitest';
import { Advisor } from './advisor.entity.js';

describe('Advisor', () => {
  const build = () =>
    new Advisor({
      userId: 5,
      name: 'Laura',
      email: 'laura@c360.co',
      phone: null,
      documentNumber: null,
      zoneId: 1,
      weeklyVisitGoal: null,
      isActive: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    });

  it('updates every field and lowercases the email', () => {
    const advisor = build();

    advisor.update({
      name: 'Laura Gómez',
      email: 'Laura.Gomez@C360.co',
      phone: '300',
      documentNumber: '1020',
      zoneId: 2,
      weeklyVisitGoal: 20,
    });

    expect(advisor).toMatchObject({
      name: 'Laura Gómez',
      email: 'laura.gomez@c360.co',
      phone: '300',
      documentNumber: '1020',
      zoneId: 2,
      weeklyVisitGoal: 20,
    });
    expect(advisor.updatedAt.getTime()).toBeGreaterThan(
      new Date('2026-01-01').getTime(),
    );
  });

  it('keeps the fields that are not sent', () => {
    const advisor = build();

    advisor.update({});

    expect(advisor).toMatchObject({
      name: 'Laura',
      email: 'laura@c360.co',
      zoneId: 1,
      weeklyVisitGoal: null,
    });
  });
});
