import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';

/**
 * Migración para la creación de las tablas `routes` (RUTA) y `route_stops` (RUTA_CLIENTE).
 *
 * En esta migración configuro la estructura relacional completa para la planeación de rutas,
 * garantizando integridad referencial con las zonas territoriales y los clientes.
 */
export class CreateRoutesTables1792670000000 implements MigrationInterface {
  name = 'CreateRoutesTables1792670000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Creo la tabla principal `routes`
    await queryRunner.createTable(
      new Table({
        name: 'routes',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'name', type: 'varchar', length: '150' },
          { name: 'description', type: 'varchar', length: '500', isNullable: true },
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

    // 2. Creo la tabla relacional `route_stops` (paradas de clientes)
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

    // 3. Claves foráneas para `routes`
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

    // 4. Claves foráneas e índices para `route_stops`
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

    // 5. Restricción única para no duplicar un cliente en la misma ruta
    await queryRunner.createUniqueConstraint(
      'route_stops',
      new TableUnique({
        name: 'UQ_route_stops_route_client',
        columnNames: ['route_id', 'client_id'],
      }),
    );

    // 6. Índices para acelerar búsquedas
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

    // 7. Relación con la tabla `visits` (Camilo E4) para conectar las visitas generadas
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
        // En caso de que no exista
      }
    }

    await queryRunner.dropTable('route_stops', true, true, true);
    await queryRunner.dropTable('routes', true, true, true);
  }
}
