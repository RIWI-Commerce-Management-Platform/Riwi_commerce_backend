import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

/** HU-07: commercial profile of the users with the ASESOR role. */
export class CreateAdvisorsTable1792720000100 implements MigrationInterface {
  name = 'CreateAdvisorsTable1792720000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'advisors',
        columns: [
          { name: 'user_id', type: 'int', isPrimary: true },
          { name: 'phone', type: 'varchar', length: '30', isNullable: true },
          {
            name: 'document_number',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          { name: 'zone_id', type: 'int', isNullable: true },
          { name: 'weekly_visit_goal', type: 'int', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('advisors', [
      new TableForeignKey({
        name: 'FK_advisors_user',
        columnNames: ['user_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'FK_advisors_zone',
        columnNames: ['zone_id'],
        referencedTableName: 'zones',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);

    // Existing advisors get an active profile.
    await queryRunner.query(
      `INSERT INTO "advisors" ("user_id") SELECT "id" FROM "user" WHERE "role" = 'ASESOR'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('advisors');
  }
}
