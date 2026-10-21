import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedVisitResults1792444800001 implements MigrationInterface {
  name = 'SeedVisitResults1792444800001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO visit_results (name, is_active) VALUES
        ('Visita realizada', true),
        ('Cliente no disponible', true),
        ('Pedido capturado', true),
        ('Muestra entregada', true),
        ('Requiere seguimiento', true)
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM visit_results WHERE name IN (
        'Visita realizada',
        'Cliente no disponible',
        'Pedido capturado',
        'Muestra entregada',
        'Requiere seguimiento'
      );
    `);
  }
}
