import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

/**
 * visits.client_id was never constrained at the DB level. Assumes every
 * existing row already has a client_id that exists in clients(id) — this
 * will fail if orphaned rows are present.
 */
export class AddVisitClientForeignKey1792650000001
  implements MigrationInterface
{
  name = 'AddVisitClientForeignKey1792650000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createForeignKey(
      'visits',
      new TableForeignKey({
        name: 'FK_visits_client',
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('visits', 'FK_visits_client');
  }
}
