import { ApiProperty } from '@nestjs/swagger';
import { CatalogItemResponseDto } from './catalog-item-response.dto.js';
import { AllCatalogs } from '../../domain/catalog.dao.js';

export class AllCatalogsResponseDto {
  @ApiProperty({ type: [CatalogItemResponseDto] })
  zones: CatalogItemResponseDto[];

  @ApiProperty({ type: [CatalogItemResponseDto] })
  clientTypes: CatalogItemResponseDto[];

  @ApiProperty({ type: [CatalogItemResponseDto] })
  potentials: CatalogItemResponseDto[];

  @ApiProperty({ type: [CatalogItemResponseDto] })
  clientStatuses: CatalogItemResponseDto[];

  @ApiProperty({ type: [CatalogItemResponseDto] })
  portfolios: CatalogItemResponseDto[];

  @ApiProperty({ type: [CatalogItemResponseDto] })
  visitResults: CatalogItemResponseDto[];

  constructor(data: AllCatalogs) {
    this.zones = data.zones.map((z) => new CatalogItemResponseDto(z));
    this.clientTypes = data.clientTypes.map(
      (c) => new CatalogItemResponseDto(c),
    );
    this.potentials = data.potentials.map((p) => new CatalogItemResponseDto(p));
    this.clientStatuses = data.clientStatuses.map(
      (s) => new CatalogItemResponseDto(s),
    );
    this.portfolios = data.portfolios.map((p) => new CatalogItemResponseDto(p));
    this.visitResults = data.visitResults.map(
      (v) => new CatalogItemResponseDto(v),
    );
  }
}
