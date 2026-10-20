import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../../shared/pagination/paginated-response.dto.js';
import { ClientResponseDto } from './client-response.dto.js';

export class PaginatedClientResponseDto extends PaginatedResponseDto<ClientResponseDto> {
  @ApiProperty({
    type: [ClientResponseDto],
    description: 'Array of clients matching search and filter criteria',
  })
  declare data: ClientResponseDto[];
}

