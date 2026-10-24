import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';

/**
 * Creates `routes` (RUTA) and `route_stops` (RUTA_CLIENTE) with their
 * foreign keys to zones and clients.
 */
export class CreateRoutesTables1792670000000 implements MigrationInterface {
  name = 'CreateRoutesTables1792670000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'routes',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'name', type: 'varchar', length: '150' },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          { name: 'zone_id', type: 'integer' },
          { name: 'advisor_id', type: 'integer', isNullable: true },
          { name: 'day_of_week', type: 'varchar', length: '20' },
          { name: 'frequency', type: 'varchar', length: '30' },
          { name: 'start_time', type: 'time', isNullable: true },
          { name: 'end_time', type: 'time', isNullable: true },
          { name: 'start_date', type: 'date' },
          { name: 'end_date', type: 'date', isNullable: true },
          {
            name: 'status',
            type: 'varchar',
            length: '30',
            default: "'DRAFT'",
          },
          {
            name: 'total_distance_km',
            type: 'decimal',
            precision: 8,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'estimated_duration_minutes',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Client stops of each route
    await queryRunner.createTable(
      new Table({
        name: 'route_stops',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'route_id', type: 'integer' },
          { name: 'client_id', type: 'integer' },
          { name: 'visit_order', type: 'integer' },
          { name: 'suggested_time', type: 'time', isNullable: true },
          {
            name: 'estimated_duration_minutes',
            type: 'integer',
            default: 30,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'routes',
      new TableForeignKey({
        name: 'FK_routes_zone',
        columnNames: ['zone_id'],
        referencedTableName: 'zones',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'route_stops',
      new TableForeignKey({
        name: 'FK_route_stops_route',
        columnNames: ['route_id'],
        referencedTableName: 'routes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'route_stops',
      new TableForeignKey({
        name: 'FK_route_stops_client',
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    // A client appears at most once per route
    await queryRunner.createUniqueConstraint(
      'route_stops',
      new TableUnique({
        name: 'UQ_route_stops_route_client',
        columnNames: ['route_id', 'client_id'],
      }),
    );

    // Indexes for the list filters
    await queryRunner.createIndex(
      'routes',
      new TableIndex({
        name: 'IDX_routes_zone_id',
        columnNames: ['zone_id'],
      }),
    );

    await queryRunner.createIndex(
      'routes',
      new TableIndex({
        name: 'IDX_routes_advisor_id',
        columnNames: ['advisor_id'],
      }),
    );

    await queryRunner.createIndex(
      'route_stops',
      new TableIndex({
        name: 'IDX_route_stops_route_order',
        columnNames: ['route_id', 'visit_order'],
      }),
    );

    // Link the generated visits (E4) to their route
    const visitsTableExists = await queryRunner.hasTable('visits');
    if (visitsTableExists) {
      await queryRunner.createForeignKey(
        'visits',
        new TableForeignKey({
          name: 'FK_visits_route',
          columnNames: ['route_id'],
          referencedTableName: 'routes',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const visitsTableExists = await queryRunner.hasTable('visits');
    if (visitsTableExists) {
      try {
        await queryRunner.dropForeignKey('visits', 'FK_visits_route');
      } catch {
        // The foreign key may not exist
      }
    }

    await queryRunner.dropTable('route_stops', true, true, true);
    await queryRunner.dropTable('routes', true, true, true);
  }
}
