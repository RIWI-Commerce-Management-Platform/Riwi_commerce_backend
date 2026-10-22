import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

/**
 * quotes.client_id was never constrained at the DB level. Assumes every
 * existing row already has a client_id that exists in clients(id) — this
 * will fail if orphaned rows are present.
 */
export class AddQuoteClientForeignKey1792650000000
  implements MigrationInterface
{
  name = 'AddQuoteClientForeignKey1792650000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createForeignKey(
      'quotes',
      new TableForeignKey({
        name: 'FK_quotes_client',
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('quotes', 'FK_quotes_client');
  }
}
