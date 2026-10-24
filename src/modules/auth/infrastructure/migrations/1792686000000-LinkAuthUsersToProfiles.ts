import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class LinkAuthUsersToProfiles1792686000000 implements MigrationInterface {
  name = 'LinkAuthUsersToProfiles1792686000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "clients" RENAME COLUMN "id" TO "id_cliente"',
    );
    await queryRunner.query(
      'ALTER TABLE "clients" ADD COLUMN "id_usuario" text',
    );
    await queryRunner.query(
      'ALTER TABLE "asesor" ALTER COLUMN "id_usuario" DROP NOT NULL',
    );

    await queryRunner.query(
      'ALTER TABLE "user" DROP CONSTRAINT "user_role_check"',
    );
    await queryRunner.query(
      `UPDATE "user" SET "role" = 'ADMINISTRADOR' WHERE "role" = 'ADMIN'`,
    );
    await queryRunner.query(
      `UPDATE "user" u
       SET "role" = 'CLIENTE'
       WHERE u."role" = 'ASESOR'
         AND EXISTS (
           SELECT 1 FROM "clients" c
           WHERE LOWER(c."email") = LOWER(u."email")
         )
         AND NOT EXISTS (
           SELECT 1 FROM "asesor" a
           WHERE a."id_usuario" = u."id"
         )`,
    );

    await queryRunner.query(
      `UPDATE "clients" c
       SET "id_usuario" = u."id"
       FROM "user" u
       WHERE u."role" = 'CLIENTE'
         AND LOWER(c."email") = LOWER(u."email")`,
    );

    await queryRunner.query(
      `UPDATE "asesor" a
       SET "id_usuario" = NULL
       FROM "user" u
       WHERE a."id_usuario" = u."id"
         AND u."role" = 'ADMINISTRADOR'`,
    );

    await queryRunner.query(
      `UPDATE "asesor" a
       SET "id_usuario" = u."id"
       FROM "user" u
       WHERE u."role" = 'ASESOR'
         AND LOWER(a."correo") = LOWER(u."email")
         AND (a."id_usuario" IS NULL OR a."id_usuario" <> u."id")`,
    );

    await queryRunner.query(
      `INSERT INTO "asesor" ("nombre", "correo", "telefono", "estado", "id_usuario")
       SELECT 
         COALESCE(NULLIF(u."name", ''), 'Usuario Asesor'),
         LOWER(u."email"),
         '0000000000',
         false,
         u."id"
       FROM "user" u
       WHERE u."role" = 'ASESOR'
         AND NOT EXISTS (
           SELECT 1 FROM "asesor" a 
           WHERE a."id_usuario" = u."id" OR LOWER(a."correo") = LOWER(u."email")
         )
         AND NOT EXISTS (
           SELECT 1 FROM "clients" c 
           WHERE LOWER(c."email") = LOWER(u."email")
         )
       ON CONFLICT ("id_usuario") DO NOTHING`,
    );

    await queryRunner.query(
      `DO $$
       DECLARE
         v_unmatched_users text;
         v_mismatched_emails text;
       BEGIN
         SELECT string_agg(
           format('id=%s, email=%s, role=%s', u."id", u."email", u."role"),
           '; '
         )
         INTO v_unmatched_users
         FROM "user" u
         WHERE (
           u."role" = 'ASESOR'
           AND NOT EXISTS (
             SELECT 1 FROM "asesor" a WHERE a."id_usuario" = u."id"
           )
         ) OR (
           u."role" = 'CLIENTE'
           AND NOT EXISTS (
             SELECT 1 FROM "clients" c WHERE c."id_usuario" = u."id"
           )
         );

         IF v_unmatched_users IS NOT NULL THEN
           RAISE EXCEPTION 'Every ASESOR and CLIENTE auth user must be matched to exactly one profile before applying this migration. Unmatched users: %', v_unmatched_users;
         END IF;

         SELECT string_agg(
           CASE
             WHEN u."role" = 'ASESOR' THEN
               format('user_id=%s, user_email=%s, profile_correo=%s (ASESOR)', u."id", u."email", a."correo")
             ELSE
               format('user_id=%s, user_email=%s, profile_email=%s (CLIENTE)', u."id", u."email", c."email")
           END,
           '; '
         )
         INTO v_mismatched_emails
         FROM "user" u
         LEFT JOIN "asesor" a ON a."id_usuario" = u."id" AND u."role" = 'ASESOR'
         LEFT JOIN "clients" c ON c."id_usuario" = u."id" AND u."role" = 'CLIENTE'
         WHERE (
           u."role" = 'ASESOR'
           AND LOWER(a."correo") <> LOWER(u."email")
         ) OR (
           u."role" = 'CLIENTE'
           AND LOWER(c."email") <> LOWER(u."email")
         );

         IF v_mismatched_emails IS NOT NULL THEN
           RAISE EXCEPTION 'Auth user emails must match their advisor or client profile email before applying this migration. Mismatched emails: %', v_mismatched_emails;
         END IF;
       END $$`,
    );

    await queryRunner.query(
      `ALTER TABLE "user"
       ADD CONSTRAINT "user_role_check"
       CHECK ("role" IN ('ADMINISTRADOR', 'DIRECTOR_REGIONAL', 'ASESOR', 'CLIENTE'))`,
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "clients_id_usuario_unique" ON "clients" ("id_usuario") WHERE "id_usuario" IS NOT NULL',
    );
    await queryRunner.createForeignKey(
      'clients',
      new TableForeignKey({
        name: 'clients_usuario_fkey',
        columnNames: ['id_usuario'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.query(
      'ALTER TABLE "quotes" ADD COLUMN "advisor_id" integer',
    );
    await queryRunner.createForeignKey(
      'quotes',
      new TableForeignKey({
        name: 'quotes_advisor_fkey',
        columnNames: ['advisor_id'],
        referencedTableName: 'asesor',
        referencedColumnNames: ['id_asesor'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.query(
      'CREATE INDEX "quotes_advisor_id_idx" ON "quotes" ("advisor_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$
       BEGIN
         IF EXISTS (SELECT 1 FROM "user" WHERE "role" = 'CLIENTE')
            OR EXISTS (SELECT 1 FROM "asesor" WHERE "id_usuario" IS NULL) THEN
           RAISE EXCEPTION 'Cannot revert auth profile links while client accounts or unlinked advisors exist';
         END IF;
       END $$`,
    );

    await queryRunner.query('DROP INDEX "quotes_advisor_id_idx"');
    await queryRunner.dropForeignKey('quotes', 'quotes_advisor_fkey');
    await queryRunner.query('ALTER TABLE "quotes" DROP COLUMN "advisor_id"');
    await queryRunner.dropForeignKey('clients', 'clients_usuario_fkey');
    await queryRunner.query('DROP INDEX "clients_id_usuario_unique"');
    await queryRunner.query('ALTER TABLE "clients" DROP COLUMN "id_usuario"');
    await queryRunner.query(
      'ALTER TABLE "clients" RENAME COLUMN "id_cliente" TO "id"',
    );
    await queryRunner.query(
      'ALTER TABLE "asesor" ALTER COLUMN "id_usuario" SET NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "user" DROP CONSTRAINT "user_role_check"',
    );
    await queryRunner.query(
      `UPDATE "user" SET "role" = 'ADMIN' WHERE "role" = 'ADMINISTRADOR'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user"
       ADD CONSTRAINT "user_role_check"
       CHECK ("role" IN ('ADMIN', 'DIRECTOR_REGIONAL', 'ASESOR'))`,
    );
  }
}
