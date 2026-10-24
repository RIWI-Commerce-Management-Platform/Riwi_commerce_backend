import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Advisor } from '../../domain/advisor.entity.js';

export class AdvisorResponseDto {
  @ApiProperty({
    example: 5,
    description: 'User id; it is the advisorId used by routes and visits',
  })
  id: number;

  @ApiProperty({ example: 'Laura Martinez' })
  name: string;

  @ApiProperty({ example: 'laura.martinez@comercial360.co' })
  email: string;

  @ApiPropertyOptional({ example: '+573001112233', nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ example: '1044556677', nullable: true })
  documentNumber: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  zoneId: number | null;

  @ApiPropertyOptional({ example: 20, nullable: true })
  weeklyVisitGoal: number | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(advisor: Advisor) {
    this.id = advisor.userId;
    this.name = advisor.name;
    this.email = advisor.email;
    this.phone = advisor.phone;
    this.documentNumber = advisor.documentNumber;
    this.zoneId = advisor.zoneId;
    this.weeklyVisitGoal = advisor.weeklyVisitGoal;
    this.isActive = advisor.isActive;
    this.createdAt = advisor.createdAt;
    this.updatedAt = advisor.updatedAt;
  }
}
