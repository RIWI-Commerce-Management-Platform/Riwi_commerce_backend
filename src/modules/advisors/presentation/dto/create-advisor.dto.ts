import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAdvisorDto {
  @ApiProperty({ example: 'Laura Martinez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'laura.martinez@comercial360.co' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({ example: '+573001112233' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: '1044556677' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  documentNumber?: string;

  @ApiPropertyOptional({ example: 1, description: 'Zone the advisor works in' })
  @IsOptional()
  @IsInt()
  @Min(1)
  zoneId?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Visits the advisor should complete each week (HU-39)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  weeklyVisitGoal?: number;
}
