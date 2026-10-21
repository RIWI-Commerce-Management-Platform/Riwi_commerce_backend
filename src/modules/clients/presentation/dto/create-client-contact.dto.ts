import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientContactDto {
  @ApiProperty({
    example: 'Carlos Mario Mendoza',
    description: 'Full name of the contact person',
  })
  name!: string;

  @ApiProperty({
    example: 'Gerente de Compras',
    description: 'Job position or role within the client organization',
  })
  position!: string;

  @ApiProperty({
    example: '+576053001122',
    description: 'Landline or office telephone number',
  })
  phone!: string;

  @ApiProperty({
    example: '+573009876543',
    description: 'Mobile phone number',
  })
  mobile!: string;

  @ApiProperty({
    example: 'carlos.mendoza@empresa.com',
    description: 'Email address of the contact person',
  })
  email!: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Indicates if this is the primary contact for the client (only one contact can be primary)',
    default: false,
  })
  isPrimary?: boolean;
}
