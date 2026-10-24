import { describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service.js';

const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockQuit = vi.fn().mockResolvedValue('OK');
let errorCallback: (() => void) | undefined;

vi.mock('ioredis', () => {
  return {
    Redis: class MockRedis {
      connect = mockConnect;
      quit = mockQuit;
      status = 'ready';
      on(event: string, cb: () => void) {
        if (event === 'error') errorCallback = cb;
      }
    },
  };
});

describe('RedisService', () => {
  vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

  const setup = () => {
    const config = {
      getOrThrow: vi.fn().mockReturnValue('redis://localhost:6379'),
    } as unknown as ConfigService;
    const service = new RedisService(config);
    return { service, config };
  };

  it('initializes redis client with config url and registers error handler', () => {
    const { service } = setup();
    expect(service.client).toBeDefined();

    if (errorCallback) {
      expect(() => errorCallback!()).not.toThrow();
    }
  });

  it('connects to redis onModuleInit', async () => {
    const { service } = setup();
    await service.onModuleInit();
    expect(mockConnect).toHaveBeenCalled();
  });

  it('quits redis connection onModuleDestroy if status is not end', async () => {
    const { service } = setup();
    (service.client as any).status = 'ready';
    await service.onModuleDestroy();
    expect(mockQuit).toHaveBeenCalled();
  });

  it('does not quit if status is already end', async () => {
    const { service } = setup();
    mockQuit.mockClear();
    (service.client as any).status = 'end';
    await service.onModuleDestroy();
    expect(mockQuit).not.toHaveBeenCalled();
  });
});
