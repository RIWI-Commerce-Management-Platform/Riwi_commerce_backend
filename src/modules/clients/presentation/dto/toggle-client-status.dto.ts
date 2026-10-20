import { ApiPropertyOptional } from '@nestjs/swagger';

export class ToggleClientStatusDto {
  @ApiPropertyOptional({
    example: false,
    description:
      'Target active status. If omitted, toggles the current active status.',
  })
  isActive?: boolean;
}

