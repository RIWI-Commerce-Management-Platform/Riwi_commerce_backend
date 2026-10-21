export class InvalidCatalogTypeError extends Error {
  constructor(type: string) {
    super(
      `Invalid catalog type "${type}". Valid types are: client-types, potentials, client-statuses, portfolios, visit-results, zones`,
    );
    this.name = 'InvalidCatalogTypeError';
  }
}

export class CatalogItemNotFoundError extends Error {
  constructor(catalogType: string, id: number) {
    super(`Catalog item with ID "${id}" was not found in "${catalogType}"`);
    this.name = 'CatalogItemNotFoundError';
  }
}
