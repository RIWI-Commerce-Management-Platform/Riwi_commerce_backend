import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateQuotesTables1792430815290 implements MigrationInterface {
  name = 'CreateQuotesTables1792430815290';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'quotes',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          {
            name: 'quote_number',
            type: 'varchar',
            length: '30',
            isUnique: true,
          },
          { name: 'client_id', type: 'uuid' },
          { name: 'status', type: 'varchar', length: '30', default: "'DRAFT'" },
          { name: 'subtotal', type: 'decimal', precision: 12, scale: 2 },
          { name: 'total', type: 'decimal', precision: 12, scale: 2 },
          { name: 'notes', type: 'text', isNullable: true },
          {
            name: 'document_key',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'quote_items',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'quote_id', type: 'uuid' },
          { name: 'product_name', type: 'varchar', length: '200' },
          { name: 'quantity', type: 'int' },
          { name: 'unit_price', type: 'decimal', precision: 12, scale: 2 },
          { name: 'subtotal', type: 'decimal', precision: 12, scale: 2 },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'quote_items',
      new TableForeignKey({
        columnNames: ['quote_id'],
        referencedTableName: 'quotes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('quote_items');
    await queryRunner.dropTable('quotes');
  }
}
