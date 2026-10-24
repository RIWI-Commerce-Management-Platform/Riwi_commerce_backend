import { ValidationPipe } from '@nestjs/common';

/**
 * Pipe for list endpoints' `@Query()` DTOs. Without `transform`, Nest passes
 * the raw `req.query` object, so DTO getters such as `parsedPage` don't exist
 * and filters/pagination are silently ignored.
 */
export const queryValidationPipe = (): ValidationPipe =>
  new ValidationPipe({ whitelist: true, transform: true });
