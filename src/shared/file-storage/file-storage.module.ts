import { Module } from '@nestjs/common';
import { FileStorageService } from './domain/file-storage.service.js';
import { S3FileStorageService } from './infrastructure/s3-file-storage.service.js';

@Module({
  providers: [
    {
      provide: FileStorageService,
      useClass: S3FileStorageService,
    },
  ],
  exports: [FileStorageService],
})
export class FileStorageModule {}
