import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The user’s registered email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'The user’s password',
  })
  @IsNotEmpty()
  password!: string;
  @ApiPropertyOptional({
    example: true,
    description:
      'When true, the session persists after the browser closes (persistent cookie). When false, it expires when the browsing session ends.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
