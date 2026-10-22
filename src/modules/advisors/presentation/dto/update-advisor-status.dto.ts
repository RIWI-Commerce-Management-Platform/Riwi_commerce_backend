import { ApiProperty } from '@nestjs/swagger';

export class UpdateAdvisorStatusDto {
  @ApiProperty({ example: false, description: 'Whether the advisor is active' })
  estado!: boolean;
}
