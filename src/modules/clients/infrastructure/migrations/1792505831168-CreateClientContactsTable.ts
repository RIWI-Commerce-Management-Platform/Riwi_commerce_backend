import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateClientContactsTable1792505831168 implements MigrationInterface {
  name = 'CreateClientContactsTable1792505831168';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'client_contacts',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'client_id', type: 'int' },
          { name: 'name', type: 'varchar', length: '150' },
          { name: 'position', type: 'varchar', length: '100' },
          { name: 'phone', type: 'varchar', length: '30' },
          { name: 'mobile', type: 'varchar', length: '30' },
          { name: 'email', type: 'varchar', length: '150' },
          { name: 'is_primary', type: 'boolean', default: false },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'client_contacts',
      new TableForeignKey({
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('client_contacts');
  }
}
