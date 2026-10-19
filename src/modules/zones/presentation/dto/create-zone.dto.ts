import { ApiProperty } from '@nestjs/swagger';

export class CreateZoneDto {
  @ApiProperty({ example: 'Barranquilla Norte' })
  name!: string;
}
