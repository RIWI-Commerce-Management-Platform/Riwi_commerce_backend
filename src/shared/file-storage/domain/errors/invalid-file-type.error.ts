export class InvalidFileTypeError extends Error {
  constructor(mimetype: string, allowedTypes: string[]) {
    super(`File type '${mimetype}' is not permitted. Allowed types: ${allowedTypes.join(', ')}.`);
    this.name = 'InvalidFileTypeError';
  }
}
