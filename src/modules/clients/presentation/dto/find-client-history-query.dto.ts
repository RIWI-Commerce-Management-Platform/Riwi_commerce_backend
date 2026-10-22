import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../../shared/pagination/pagination-query.dto.js';
import { ClientHistoryFilterCriteria } from '../../domain/client-history-filter.criteria.js';

export class FindClientHistoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter entries by specific action (e.g. visit.started, note.added)',
    type: String,
  })
  action?: string;

  @ApiPropertyOptional({
    description: 'ISO-8601 start date to filter interactions from (inclusive)',
    type: String,
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'ISO-8601 end date to filter interactions up to (inclusive)',
    type: String,
  })
  endDate?: string;

  static toCriteria(
    dto?: Partial<FindClientHistoryQueryDto> | Record<string, unknown>,
  ): ClientHistoryFilterCriteria {
    const rawPage = dto ? (dto as Record<string, unknown>).page : undefined;
    const rawLimit = dto ? (dto as Record<string, unknown>).limit : undefined;
    const parsedPage = Number(rawPage);
    const parsedLimit = Number(rawLimit);

    const page =
      Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
    let limit =
      Number.isInteger(parsedLimit) && parsedLimit >= 1 ? parsedLimit : 10;
    limit = Math.min(limit, 100);

    const criteria: ClientHistoryFilterCriteria = { page, limit };

    const action = dto ? (dto as Record<string, unknown>).action : undefined;
    if (typeof action === 'string' && action.trim().length > 0) {
      criteria.action = action.trim();
    }

    const startDate = dto
      ? (dto as Record<string, unknown>).startDate
      : undefined;
    if (startDate) {
      const parsedDate = new Date(startDate as string);
      if (!Number.isNaN(parsedDate.getTime())) {
        criteria.startDate = parsedDate;
      }
    }

    const endDate = dto ? (dto as Record<string, unknown>).endDate : undefined;
    if (endDate) {
      const parsedDate = new Date(endDate as string);
      if (!Number.isNaN(parsedDate.getTime())) {
        criteria.endDate = parsedDate;
      }
    }

    return criteria;
  }

  toCriteria(): ClientHistoryFilterCriteria {
    return FindClientHistoryQueryDto.toCriteria(this);
  }
}
