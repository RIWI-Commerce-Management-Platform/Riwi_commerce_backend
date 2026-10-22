import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../../shared/pagination/paginated-response.dto.js';
import { ClientHistoryResponseDto } from './client-history-response.dto.js';

export class PaginatedClientHistoryResponseDto extends PaginatedResponseDto<ClientHistoryResponseDto> {
  @ApiProperty({
    type: [ClientHistoryResponseDto],
    description: 'Array of client history records matching criteria',
  })
  declare data: ClientHistoryResponseDto[];
}
