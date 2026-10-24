import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateClientContactDto {
  @ApiPropertyOptional({
    example: 'Carlos Mario Mendoza',
    description: 'Full name of the contact person',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    example: 'Sales Director',
    description: 'Job position or role within the client organization',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({
    example: '+576053001122',
    description: 'Landline or office telephone number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    example: '+573009876543',
    description: 'Mobile phone number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  mobile?: string;

  @ApiPropertyOptional({
    example: 'carlos.mendoza@empresa.com',
    description: 'Email address of the contact person',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Indicates if this is the primary contact for the client',
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
