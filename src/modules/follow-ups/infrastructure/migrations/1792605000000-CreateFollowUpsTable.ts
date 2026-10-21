import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateFollowUpsTable1792605000000 implements MigrationInterface {
  name = 'CreateFollowUpsTable1792605000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'follow_ups',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'visit_id', type: 'integer', isNullable: false },
          { name: 'next_date', type: 'date', isNullable: false },
          {
            name: 'activity',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'observation',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'responsible_advisor_id',
            type: 'integer',
            isNullable: false,
          },
          { name: 'completed', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'follow_ups',
      new TableForeignKey({
        name: 'FK_follow_ups_visit',
        columnNames: ['visit_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'visits',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('follow_ups');
  }
}
