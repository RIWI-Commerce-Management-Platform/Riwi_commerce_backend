import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * HU-25: follow_ups (SEGUIMIENTO).
 * HU-27: whether a visit generated a quote or an order.
 * HU-28: visit_attachments (files stored in S3, only the key is kept).
 */
export class AddVisitFollowUpsAttachmentsAndOutcome1792720000400 implements MigrationInterface {
  name = 'AddVisitFollowUpsAttachmentsAndOutcome1792720000400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('visits', [
      new TableColumn({
        name: 'quote_generated',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'order_generated',
        type: 'boolean',
        default: false,
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'follow_ups',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'visit_id', type: 'integer', isNullable: true },
          { name: 'client_id', type: 'integer' },
          { name: 'responsible_id', type: 'integer' },
          { name: 'created_by', type: 'integer' },
          { name: 'due_date', type: 'timestamptz' },
          { name: 'activity', type: 'varchar', length: '150' },
          {
            name: 'observation',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'PENDING'",
          },
          { name: 'completed_at', type: 'timestamptz', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('follow_ups', [
      new TableForeignKey({
        name: 'FK_follow_ups_visit',
        columnNames: ['visit_id'],
        referencedTableName: 'visits',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        name: 'FK_follow_ups_client',
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'FK_follow_ups_responsible',
        columnNames: ['responsible_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        name: 'FK_follow_ups_created_by',
        columnNames: ['created_by'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    ]);

    await queryRunner.createIndex(
      'follow_ups',
      new TableIndex({
        name: 'IDX_follow_ups_responsible_due',
        columnNames: ['responsible_id', 'due_date'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'visit_attachments',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'visit_id', type: 'integer' },
          { name: 'file_key', type: 'varchar', length: '255' },
          { name: 'original_name', type: 'varchar', length: '255' },
          { name: 'mime_type', type: 'varchar', length: '100' },
          { name: 'size', type: 'integer' },
          { name: 'uploaded_by', type: 'integer' },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('visit_attachments', [
      new TableForeignKey({
        name: 'FK_visit_attachments_visit',
        columnNames: ['visit_id'],
        referencedTableName: 'visits',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'FK_visit_attachments_uploaded_by',
        columnNames: ['uploaded_by'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    ]);

    await queryRunner.createIndex(
      'visit_attachments',
      new TableIndex({
        name: 'IDX_visit_attachments_visit',
        columnNames: ['visit_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('visit_attachments');
    await queryRunner.dropTable('follow_ups');
    await queryRunner.dropColumn('visits', 'order_generated');
    await queryRunner.dropColumn('visits', 'quote_generated');
  }
}
