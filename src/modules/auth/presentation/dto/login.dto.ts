import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The user’s registered email address',
  })
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'The user’s password',
  })
  password!: string;
}
