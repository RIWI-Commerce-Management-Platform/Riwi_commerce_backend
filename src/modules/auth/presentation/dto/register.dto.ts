import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'Juan Perez',
    description: 'The user’s full name',
  })
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The user’s email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'The account password',
  })
  @MinLength(8)
  password!: string;
}
