import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClientContactDto {
  @ApiPropertyOptional({
    example: 'Carlos Mario Mendoza',
    description: 'Full name of the contact person',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'Director Comercial',
    description: 'Job position or role within the client organization',
  })
  position?: string;

  @ApiPropertyOptional({
    example: '+576053001122',
    description: 'Landline or office telephone number',
  })
  phone?: string;

  @ApiPropertyOptional({
    example: '+573009876543',
    description: 'Mobile phone number',
  })
  mobile?: string;

  @ApiPropertyOptional({
    example: 'carlos.mendoza@empresa.com',
    description: 'Email address of the contact person',
  })
  email?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Indicates if this is the primary contact for the client',
  })
  isPrimary?: boolean;
}
