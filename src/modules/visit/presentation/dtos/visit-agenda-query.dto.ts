import { IsIn, IsOptional } from 'class-validator';

import { Transform } from 'class-transformer';

export class VisitAgendaQueryDto {
  @IsOptional()
  @Transform(({ value }) => value ?? 'day')
  @IsIn(['day', 'week'])
  period: 'day' | 'week' = 'day';
}
