import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FileStorageService } from '../domain/file-storage.service.js';
import { UploadFileOptions } from '../domain/upload-file-options.interface.js';
import { UploadedFileResult } from '../domain/uploaded-file-result.interface.js';
import { FileSizeExceededError } from '../domain/errors/file-size-exceeded.error.js';
import { InvalidFileTypeError } from '../domain/errors/invalid-file-type.error.js';

@Injectable()
export class S3FileStorageService implements FileStorageService {
  private readonly logger = new Logger(S3FileStorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly maxFileSizeInBytes = 10 * 1024 * 1024; // 10MB limit

  private readonly allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('aws.region') ?? 'us-east-1';
    this.bucketName =
      this.configService.get<string>('aws.bucketName') ??
      'comercial-360-bucket';

    const accessKeyId = this.configService.get<string>('aws.accessKeyId');
    const secretAccessKey = this.configService.get<string>(
      'aws.secretAccessKey',
    );

    this.s3Client = new S3Client({
      region,
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
  }

  async upload(options: UploadFileOptions): Promise<UploadedFileResult> {
    this.validateFile(options);

    const folder = options.folder ? `${options.folder}/` : '';
    const cleanFilename = options.filename.replace(/\s+/g, '_');
    const key = `${folder}${Date.now()}-${randomUUID()}-${cleanFilename}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: options.buffer,
        ContentType: options.mimetype,
      }),
    );

    this.logger.log(`Uploaded file to S3: ${key}`);

    return {
      key,
      originalName: options.filename,
      mimetype: options.mimetype,
      size: options.buffer.length,
    };
  }

  async getPresignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  async delete(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );

    this.logger.log(`Deleted file from S3: ${key}`);
  }

  private validateFile(options: UploadFileOptions): void {
    if (options.buffer.length > this.maxFileSizeInBytes) {
      throw new FileSizeExceededError(this.maxFileSizeInBytes);
    }

    if (!this.allowedMimeTypes.includes(options.mimetype)) {
      throw new InvalidFileTypeError(options.mimetype, this.allowedMimeTypes);
    }
  }
}
