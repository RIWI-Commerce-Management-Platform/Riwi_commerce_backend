import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateAdvisorDto {
  @ApiPropertyOptional({ example: 'Laura Martinez' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'laura.martinez@comercial360.co' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+573001112233', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiPropertyOptional({ example: '1044556677', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  documentNumber?: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  zoneId?: number | null;

  @ApiPropertyOptional({ example: 20, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  weeklyVisitGoal?: number | null;
}
