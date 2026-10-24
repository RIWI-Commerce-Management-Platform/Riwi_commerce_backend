import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * HU-06/HU-34: orders inherit the advisor of their quote so advisors only see
 * their own orders and lists can filter by advisor.
 */
export class AddOrderAdvisor1792720000300 implements MigrationInterface {
  name = 'AddOrderAdvisor1792720000300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'orders',
      new TableColumn({ name: 'advisor_id', type: 'int', isNullable: true }),
    );

    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        name: 'FK_orders_advisor',
        columnNames: ['advisor_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_orders_advisor',
        columnNames: ['advisor_id'],
      }),
    );

    // Orders created before this migration take the advisor of their quote.
    await queryRunner.query(
      `UPDATE "orders" o SET "advisor_id" = q."advisor_id" FROM "quotes" q WHERE q."id" = o."quote_id"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('orders', 'IDX_orders_advisor');
    await queryRunner.dropForeignKey('orders', 'FK_orders_advisor');
    await queryRunner.dropColumn('orders', 'advisor_id');
  }
}
