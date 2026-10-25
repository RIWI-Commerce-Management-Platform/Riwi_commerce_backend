import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateVisitTables1792444800000 implements MigrationInterface {
  name = 'CreateVisitTables1792444800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'visits',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'client_id', type: 'integer' },
          { name: 'advisor_id', type: 'integer' },
          { name: 'route_id', type: 'integer', isNullable: true },
          { name: 'scheduled_at', type: 'timestamptz' },
          { name: 'actual_date', type: 'date', isNullable: true },
          { name: 'start_time', type: 'time', isNullable: true },
          { name: 'end_time', type: 'time', isNullable: true },
          {
            name: 'status',
            type: 'varchar',
            length: '30',
            default: "'PENDING'",
          },
          {
            name: 'objective',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'observations',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'visit_results',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'name', type: 'varchar', length: '100' },
          { name: 'is_active', type: 'boolean', default: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'visit_result_links',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'visit_id', type: 'integer' },
          { name: 'result_id', type: 'integer' },
          {
            name: 'observation',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
        ],
        uniques: [
          {
            name: 'UQ_visit_result_links_visit_result',
            columnNames: ['visit_id', 'result_id'],
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'visit_result_links',
      new TableForeignKey({
        name: 'FK_visit_result_links_visit',
        columnNames: ['visit_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'visits',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'visit_result_links',
      new TableForeignKey({
        name: 'FK_visit_result_links_result',
        columnNames: ['result_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'visit_results',
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('visit_result_links');
    await queryRunner.dropTable('visit_results');
    await queryRunner.dropTable('visits');
  }
}
