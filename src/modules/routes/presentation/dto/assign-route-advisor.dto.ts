import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

/**
 * Body to assign a route to an advisor and schedule its visits (HU-20).
 */
export class AssignRouteAdvisorDto {
  @ApiProperty({
    description: 'Id (user id) of the assigned advisor',
    example: 5,
  })
  @IsInt()
  @IsPositive()
  advisorId!: number;
}
