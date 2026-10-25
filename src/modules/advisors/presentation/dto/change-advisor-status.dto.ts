import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ChangeAdvisorStatusDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  isActive!: boolean;
}
