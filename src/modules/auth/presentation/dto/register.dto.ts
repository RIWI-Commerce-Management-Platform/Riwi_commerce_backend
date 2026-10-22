import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'Juan Perez',
    description: 'The user’s full name',
  })
  name!: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The user’s email address',
  })
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'The account password',
  })
  password!: string;
}
