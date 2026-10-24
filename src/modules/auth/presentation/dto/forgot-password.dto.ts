import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsUrl } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3000/reset-password',
    description:
      'Frontend page that receives `?token=`. Defaults to FRONTEND_URL/reset-password.',
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  redirectTo?: string;
}
