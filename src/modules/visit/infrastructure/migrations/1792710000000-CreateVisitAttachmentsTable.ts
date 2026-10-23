import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateVisitAttachmentsTable1792710000000 implements MigrationInterface {
  name = 'CreateVisitAttachmentsTable1792710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'visit_attachments',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'visit_id', type: 'integer', isNullable: false },
          { name: 'storage_key', type: 'text', isNullable: false },
          { name: 'original_name', type: 'text', isNullable: false },
          {
            name: 'mimetype',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          { name: 'size', type: 'integer', isNullable: false },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'visit_attachments',
      new TableForeignKey({
        name: 'FK_visit_attachments_visit',
        columnNames: ['visit_id'],
        referencedTableName: 'visits',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'visit_attachments',
      new TableIndex({
        name: 'IDX_visit_attachments_visit_id',
        columnNames: ['visit_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('visit_attachments');
  }
}
