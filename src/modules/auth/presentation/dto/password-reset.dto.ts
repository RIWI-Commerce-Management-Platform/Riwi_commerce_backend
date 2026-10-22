import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'The one-time password reset token' })
  token!: string;

  @ApiProperty({
    description: 'The new password (8 to 128 characters)',
    minLength: 8,
    maxLength: 128,
  })
  newPassword!: string;
}
