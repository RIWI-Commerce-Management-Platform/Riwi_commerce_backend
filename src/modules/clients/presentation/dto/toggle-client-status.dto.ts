import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ToggleClientStatusDto {
  @ApiPropertyOptional({
    example: false,
    description:
      'Target active status. If omitted, toggles the current active status.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
