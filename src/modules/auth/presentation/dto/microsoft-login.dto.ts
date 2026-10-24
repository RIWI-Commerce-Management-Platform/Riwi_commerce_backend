import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';

export class MicrosoftLoginDto {
  @ApiPropertyOptional({
    example: 'http://localhost:3000/dashboard',
    description:
      'Where to send the browser after a successful sign-in. Defaults to FRONTEND_URL.',
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  callbackURL?: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3000/login?error=microsoft',
    description: 'Where to send the browser if the sign-in fails.',
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  errorCallbackURL?: string;
}
