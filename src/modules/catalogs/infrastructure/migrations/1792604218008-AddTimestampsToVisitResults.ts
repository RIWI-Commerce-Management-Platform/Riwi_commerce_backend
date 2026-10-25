import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTimestampsToVisitResults1792604218008 implements MigrationInterface {
  name = 'AddTimestampsToVisitResults1792604218008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasCreatedAt = await queryRunner.hasColumn(
      'visit_results',
      'created_at',
    );
    if (!hasCreatedAt) {
      await queryRunner.addColumn(
        'visit_results',
        new TableColumn({
          name: 'created_at',
          type: 'timestamptz',
          default: 'now()',
        }),
      );
    }

    const hasUpdatedAt = await queryRunner.hasColumn(
      'visit_results',
      'updated_at',
    );
    if (!hasUpdatedAt) {
      await queryRunner.addColumn(
        'visit_results',
        new TableColumn({
          name: 'updated_at',
          type: 'timestamptz',
          default: 'now()',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('visit_results', 'updated_at');
    await queryRunner.dropColumn('visit_results', 'created_at');
  }
}
