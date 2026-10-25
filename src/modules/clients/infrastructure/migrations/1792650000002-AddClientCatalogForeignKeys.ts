import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

/**
 * clients.zone_id/client_type_id/potential_id/client_status_id were never
 * constrained at the DB level (zone_id could have referenced zones from the
 * start; the other three couldn't until HU-14's catalog tables existed).
 * Assumes every existing row already has ids that exist in the referenced
 * tables — this will fail if orphaned rows are present.
 */
export class AddClientCatalogForeignKeys1792650000002 implements MigrationInterface {
  name = 'AddClientCatalogForeignKeys1792650000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createForeignKey(
      'clients',
      new TableForeignKey({
        name: 'FK_clients_zone',
        columnNames: ['zone_id'],
        referencedTableName: 'zones',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'clients',
      new TableForeignKey({
        name: 'FK_clients_client_type',
        columnNames: ['client_type_id'],
        referencedTableName: 'client_types',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'clients',
      new TableForeignKey({
        name: 'FK_clients_potential',
        columnNames: ['potential_id'],
        referencedTableName: 'potentials',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'clients',
      new TableForeignKey({
        name: 'FK_clients_client_status',
        columnNames: ['client_status_id'],
        referencedTableName: 'client_statuses',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('clients', 'FK_clients_client_status');
    await queryRunner.dropForeignKey('clients', 'FK_clients_potential');
    await queryRunner.dropForeignKey('clients', 'FK_clients_client_type');
    await queryRunner.dropForeignKey('clients', 'FK_clients_zone');
  }
}
