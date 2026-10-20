import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { S3FileStorageService } from './s3-file-storage.service.js';
import { FileSizeExceededError } from '../domain/errors/file-size-exceeded.error.js';
import { InvalidFileTypeError } from '../domain/errors/invalid-file-type.error.js';

describe('S3FileStorageService', () => {
  let service: S3FileStorageService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'aws.region') return 'us-east-1';
        if (key === 'aws.bucketName') return 'test-bucket';
        return undefined;
      }) as any,
    };

    service = new S3FileStorageService(mockConfigService as ConfigService);
  });

  it('should reject files that exceed maximum size', async () => {
    const hugeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

    await expect(
      service.upload({
        buffer: hugeBuffer,
        filename: 'large.pdf',
        mimetype: 'application/pdf',
      }),
    ).rejects.toThrow(FileSizeExceededError);
  });

  it('should reject files with unsupported mime types', async () => {
    const buffer = Buffer.from('executable script');

    await expect(
      service.upload({
        buffer,
        filename: 'script.sh',
        mimetype: 'application/x-sh',
      }),
    ).rejects.toThrow(InvalidFileTypeError);
  });
});
