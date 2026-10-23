import { describe, expect, it } from 'vitest';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator.js';
import { CurrentSession } from './current-session.decorator.js';
import { ExecutionContext } from '@nestjs/common';

function getDecoratorFactory(decorator: any) {
  class Target {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    action(@decorator() _param: any) {}
  }
  const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Target, 'action');
  const key = Object.keys(metadata)[0];
  return metadata[key].factory;
}

describe('Auth Param Decorators', () => {
  it('CurrentUser should extract user or specific property', () => {
    const factory = getDecoratorFactory(CurrentUser);
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 'u1', name: 'Carlos' } }),
      }),
    } as ExecutionContext;

    expect(factory(undefined, mockCtx)).toEqual({ id: 'u1', name: 'Carlos' });
    expect(factory('name', mockCtx)).toBe('Carlos');
  });

  it('CurrentSession should extract session or specific property', () => {
    const factory = getDecoratorFactory(CurrentSession);
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({ session: { id: 's1', token: 'xyz' } }),
      }),
    } as ExecutionContext;

    expect(factory(undefined, mockCtx)).toEqual({ id: 's1', token: 'xyz' });
    expect(factory('token', mockCtx)).toBe('xyz');
  });
});
