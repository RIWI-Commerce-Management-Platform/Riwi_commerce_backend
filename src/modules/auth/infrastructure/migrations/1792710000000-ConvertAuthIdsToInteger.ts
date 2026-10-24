import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Switches the Better Auth tables from random text ids to serial integers
 * (auth.ts uses `advanced.database.generateId: 'serial'`).
 *
 * Existing rows are kept: every user gets a new integer id and the
 * session/account rows are re-pointed to it through a temporary column.
 * Session, account and verification ids aren't referenced anywhere, so they
 * are simply renumbered.
 */
export class ConvertAuthIdsToInteger1792710000000 implements MigrationInterface {
  name = 'ConvertAuthIdsToInteger1792710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.dropUserForeignKeys(queryRunner);

    // 1. New integer id for every user, plus the mapping on its children
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "new_id" SERIAL`);
    for (const table of ['session', 'account']) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN "new_userId" integer`,
      );
      await queryRunner.query(
        `UPDATE "${table}" t SET "new_userId" = u."new_id"
         FROM "user" u WHERE t."userId" = u."id"`,
      );
    }

    // 2. Swap the user primary key (dropping the column drops its PK too)
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "new_id" TO "id"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "user_new_id_seq" RENAME TO "user_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id")`,
    );

    // 3. Swap userId on session/account and renumber their own ids
    for (const table of ['session', 'account']) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "userId"`);
      await queryRunner.query(
        `ALTER TABLE "${table}" RENAME COLUMN "new_userId" TO "userId"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "userId" SET NOT NULL`,
      );
      await queryRunner.query(
        `CREATE INDEX "${table}_userId_idx" ON "${table}" ("userId")`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "${table}_userId_fkey"
         FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE`,
      );
    }
    for (const table of ['session', 'account', 'verification']) {
      await this.renumberPrimaryKey(queryRunner, table);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropUserForeignKeys(queryRunner);

    for (const table of ['user', 'session', 'account', 'verification']) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "id" DROP DEFAULT`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "id" TYPE text USING "id"::text`,
      );
      await queryRunner.query(`DROP SEQUENCE IF EXISTS "${table}_id_seq"`);
    }

    for (const table of ['session', 'account']) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "userId" TYPE text USING "userId"::text`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "${table}_userId_fkey"
         FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE`,
      );
    }
  }

  /** Drops the session/account → user foreign keys, whatever their names. */
  private async dropUserForeignKeys(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of ['session', 'account']) {
      const table = await queryRunner.getTable(tableName);
      const foreignKeys =
        table?.foreignKeys.filter((fk) => fk.referencedTableName === 'user') ??
        [];
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey(tableName, fk);
      }
    }
  }

  private async renumberPrimaryKey(
    queryRunner: QueryRunner,
    table: string,
  ): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "${table}" ADD COLUMN "id" SERIAL PRIMARY KEY`,
    );
  }
}
