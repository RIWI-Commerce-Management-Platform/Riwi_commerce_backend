import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateClientsTable1792505831167 implements MigrationInterface {
  name = 'CreateClientsTable1792505831167';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'clients',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'nit', type: 'varchar', length: '30', isUnique: true },
          { name: 'business_name', type: 'varchar', length: '255' },
          { name: 'commercial_name', type: 'varchar', length: '255' },
          { name: 'address', type: 'varchar', length: '255' },
          { name: 'department', type: 'varchar', length: '100' },
          { name: 'municipality', type: 'varchar', length: '100' },
          { name: 'neighborhood', type: 'varchar', length: '100' },
          { name: 'phone', type: 'varchar', length: '30' },
          { name: 'email', type: 'varchar', length: '150' },
          { name: 'zone_id', type: 'uuid' },
          { name: 'client_type_id', type: 'uuid' },
          { name: 'potential_id', type: 'uuid' },
          { name: 'client_status_id', type: 'uuid' },
          { name: 'visit_frequency_days', type: 'int' },
          {
            name: 'latitude',
            type: 'double precision',
            isNullable: true,
          },
          {
            name: 'longitude',
            type: 'double precision',
            isNullable: true,
          },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('clients');
  }
}
