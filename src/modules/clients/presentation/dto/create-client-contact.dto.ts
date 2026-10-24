import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateClientContactDto {
  @ApiProperty({
    example: 'Carlos Mario Mendoza',
    description: 'Full name of the contact person',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiProperty({
    example: 'Purchasing Manager',
    description: 'Job position or role within the client organization',
  })
  @IsString()
  @MaxLength(100)
  position!: string;

  @ApiProperty({
    example: '+576053001122',
    description: 'Landline or office telephone number',
  })
  @IsString()
  @MaxLength(30)
  phone!: string;

  @ApiProperty({
    example: '+573009876543',
    description: 'Mobile phone number',
  })
  @IsString()
  @MaxLength(30)
  mobile!: string;

  @ApiProperty({
    example: 'carlos.mendoza@empresa.com',
    description: 'Email address of the contact person',
  })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Indicates if this is the primary contact for the client (only one contact can be primary)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
