import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCatalogsTables1792505831169 implements MigrationInterface {
  name = 'CreateCatalogsTables1792505831169';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. zones (if not already created)
    const zonesExists = await queryRunner.hasTable('zones');
    if (!zonesExists) {
      await queryRunner.createTable(
        new Table({
          name: 'zones',
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true },
            { name: 'name', type: 'varchar', length: '120', isUnique: true },
            { name: 'is_active', type: 'boolean', default: true },
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
            { name: 'updated_at', type: 'timestamptz', default: 'now()' },
          ],
        }),
        true,
      );
    }

    // 2. client_types
    await queryRunner.createTable(
      new Table({
        name: 'client_types',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'name', type: 'varchar', length: '100', isUnique: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    // 3. potentials
    await queryRunner.createTable(
      new Table({
        name: 'potentials',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'name', type: 'varchar', length: '50', isUnique: true },
          { name: 'order', type: 'int', default: 1 },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    // 4. client_statuses
    await queryRunner.createTable(
      new Table({
        name: 'client_statuses',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'name', type: 'varchar', length: '50', isUnique: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    // 5. portfolios
    await queryRunner.createTable(
      new Table({
        name: 'portfolios',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'name', type: 'varchar', length: '100', isUnique: true },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            default: "''",
          },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    // 6. visit_results
    await queryRunner.createTable(
      new Table({
        name: 'visit_results',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'name', type: 'varchar', length: '100', isUnique: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('visit_results', true);
    await queryRunner.dropTable('portfolios', true);
    await queryRunner.dropTable('client_statuses', true);
    await queryRunner.dropTable('potentials', true);
    await queryRunner.dropTable('client_types', true);
  }
}
