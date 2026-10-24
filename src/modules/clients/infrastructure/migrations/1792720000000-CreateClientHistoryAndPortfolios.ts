import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * HU-15: client_history (HISTORIAL_CLIENTE) written by ActivityLogService.
 * HU-16: client_portfolios (CLIENTE_PORTAFOLIO).
 */
export class CreateClientHistoryAndPortfolios1792720000000 implements MigrationInterface {
  name = 'CreateClientHistoryAndPortfolios1792720000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'client_history',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'client_id', type: 'int', isNullable: true },
          { name: 'user_id', type: 'int' },
          { name: 'action', type: 'varchar', length: '80' },
          { name: 'entity_type', type: 'varchar', length: '40' },
          { name: 'entity_id', type: 'varchar', length: '40' },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'client_history',
      new TableIndex({
        name: 'IDX_client_history_client_created',
        columnNames: ['client_id', 'created_at'],
      }),
    );

    await queryRunner.createForeignKeys('client_history', [
      new TableForeignKey({
        name: 'FK_client_history_client',
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'FK_client_history_user',
        columnNames: ['user_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'client_portfolios',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'client_id', type: 'int' },
          { name: 'portfolio_id', type: 'int' },
          { name: 'registered_at', type: 'timestamptz', default: 'now()' },
        ],
        uniques: [
          {
            name: 'UQ_client_portfolios_client_portfolio',
            columnNames: ['client_id', 'portfolio_id'],
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('client_portfolios', [
      new TableForeignKey({
        name: 'FK_client_portfolios_client',
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'FK_client_portfolios_portfolio',
        columnNames: ['portfolio_id'],
        referencedTableName: 'portfolios',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('client_portfolios');
    await queryRunner.dropTable('client_history');
  }
}
