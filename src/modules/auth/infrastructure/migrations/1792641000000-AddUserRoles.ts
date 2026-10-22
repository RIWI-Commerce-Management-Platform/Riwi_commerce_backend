import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class AddUserRoles1792641000000 implements MigrationInterface {
  name = 'AddUserRoles1792641000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user"
       ADD COLUMN "role" varchar(32) NOT NULL DEFAULT 'ASESOR',
       ADD COLUMN "zoneId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "user"
       ADD CONSTRAINT "user_role_check"
       CHECK ("role" IN ('ADMIN', 'DIRECTOR_REGIONAL', 'ASESOR'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user"
       ADD CONSTRAINT "user_role_zone_check"
       CHECK (
         ("role" = 'DIRECTOR_REGIONAL' AND "zoneId" IS NOT NULL)
         OR ("role" <> 'DIRECTOR_REGIONAL' AND "zoneId" IS NULL)
       )`,
    );
    await queryRunner.createForeignKey(
      'user',
      new TableForeignKey({
        name: 'user_zoneId_fkey',
        columnNames: ['zoneId'],
        referencedTableName: 'zones',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.query(
      'CREATE INDEX "user_zoneId_idx" ON "user" ("zoneId")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "user_zoneId_idx"');
    await queryRunner.dropForeignKey('user', 'user_zoneId_fkey');
    await queryRunner.query(
      'ALTER TABLE "user" DROP CONSTRAINT "user_role_zone_check"',
    );
    await queryRunner.query(
      'ALTER TABLE "user" DROP CONSTRAINT "user_role_check"',
    );
    await queryRunner.query(
      'ALTER TABLE "user" DROP COLUMN "zoneId", DROP COLUMN "role"',
    );
  }
}
