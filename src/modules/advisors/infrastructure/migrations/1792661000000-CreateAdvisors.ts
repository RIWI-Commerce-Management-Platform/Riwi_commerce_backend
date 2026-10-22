import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateAdvisors1792661000000 implements MigrationInterface {
  name = 'CreateAdvisors1792661000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'asesor',
        columns: [
          {
            name: 'id_asesor',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'nombre', type: 'varchar', length: '200' },
          { name: 'correo', type: 'varchar', length: '255' },
          { name: 'telefono', type: 'varchar', length: '30' },
          { name: 'estado', type: 'boolean', default: true },
          { name: 'id_usuario', type: 'text', isUnique: true },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'asesor',
      new TableForeignKey({
        name: 'asesor_usuario_fkey',
        columnNames: ['id_usuario'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.query(
      'CREATE UNIQUE INDEX "asesor_correo_lower_unique" ON "asesor" (LOWER("correo"))',
    );
    await queryRunner.query(
      'CREATE INDEX "asesor_estado_idx" ON "asesor" ("estado")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "asesor_estado_idx"');
    await queryRunner.query('DROP INDEX "asesor_correo_lower_unique"');
    await queryRunner.dropForeignKey('asesor', 'asesor_usuario_fkey');
    await queryRunner.dropTable('asesor');
  }
}
