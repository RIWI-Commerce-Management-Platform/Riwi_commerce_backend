import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * HU-06/HU-34: the advisor who created each quote, so advisors only see
 * their own quotes and lists can filter by advisor.
 * HU-27: the visit a quote was generated from.
 * Existing quotes keep a NULL advisor.
 */
export class AddQuoteAdvisorAndVisit1792720000200 implements MigrationInterface {
  name = 'AddQuoteAdvisorAndVisit1792720000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('quotes', [
      new TableColumn({ name: 'advisor_id', type: 'int', isNullable: true }),
      new TableColumn({ name: 'visit_id', type: 'int', isNullable: true }),
    ]);

    await queryRunner.createForeignKeys('quotes', [
      new TableForeignKey({
        name: 'FK_quotes_advisor',
        columnNames: ['advisor_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        name: 'FK_quotes_visit',
        columnNames: ['visit_id'],
        referencedTableName: 'visits',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);

    await queryRunner.createIndex(
      'quotes',
      new TableIndex({
        name: 'IDX_quotes_advisor',
        columnNames: ['advisor_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('quotes', 'IDX_quotes_advisor');
    await queryRunner.dropForeignKey('quotes', 'FK_quotes_visit');
    await queryRunner.dropForeignKey('quotes', 'FK_quotes_advisor');
    await queryRunner.dropColumn('quotes', 'visit_id');
    await queryRunner.dropColumn('quotes', 'advisor_id');
  }
}
