import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateZoneDto {
  @ApiProperty({ example: 'Barranquilla Norte' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
