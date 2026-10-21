export class FileSizeExceededError extends Error {
  constructor(maxSizeInBytes: number) {
    const sizeInMb = (maxSizeInBytes / (1024 * 1024)).toFixed(1);
    super(`File size exceeds maximum allowed limit of ${sizeInMb}MB.`);
    this.name = 'FileSizeExceededError';
  }
}
