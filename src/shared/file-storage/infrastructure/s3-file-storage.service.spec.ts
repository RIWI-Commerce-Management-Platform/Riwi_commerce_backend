import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { S3FileStorageService } from './s3-file-storage.service.js';
import { FileSizeExceededError } from '../domain/errors/file-size-exceeded.error.js';
import { InvalidFileTypeError } from '../domain/errors/invalid-file-type.error.js';

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://s3.amazonaws.com/test-bucket/presigned-url'),
}));

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

  it('should upload valid file to S3 and return result', async () => {
    const buffer = Buffer.from('valid pdf content');
    const sendSpy = vi.spyOn((service as any).s3Client, 'send').mockResolvedValue({} as never);

    const result = await service.upload({
      buffer,
      filename: 'my document.pdf',
      mimetype: 'application/pdf',
      folder: 'quotes',
    });

    expect(sendSpy).toHaveBeenCalled();
    expect(result.key).toContain('quotes/');
    expect(result.key).toContain('my_document.pdf');
    expect(result.size).toBe(buffer.length);
  });

  it('should get presigned url', async () => {
    const url = await service.getPresignedUrl('quotes/test.pdf', 1800);
    expect(url).toBe('https://s3.amazonaws.com/test-bucket/presigned-url');
  });

  it('should delete file from S3', async () => {
    const sendSpy = vi.spyOn((service as any).s3Client, 'send').mockResolvedValue({} as never);
    await service.delete('quotes/test.pdf');
    expect(sendSpy).toHaveBeenCalled();
  });
});
