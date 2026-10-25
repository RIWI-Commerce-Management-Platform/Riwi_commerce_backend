import { UploadFileOptions } from './upload-file-options.interface.js';
import { UploadedFileResult } from './uploaded-file-result.interface.js';

/**
 * Abstract port for file storage operations.
 * Consumed by use cases across modules (e.g. quotes attachments, visits photos).
 */
export abstract class FileStorageService {
  abstract upload(options: UploadFileOptions): Promise<UploadedFileResult>;
  abstract getPresignedUrl(
    key: string,
    expiresInSeconds?: number,
  ): Promise<string>;
  abstract delete(key: string): Promise<void>;
}
