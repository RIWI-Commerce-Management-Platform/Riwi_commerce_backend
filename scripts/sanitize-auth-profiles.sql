-- =============================================================================
-- SCRIPT DE SANEAMIENTO PRE-MIGRACIÓN (EJECUTAR DENTRO DE TRANSACCIÓN)
-- =============================================================================
-- Este script es idempotente y transaccional. Puede aplicarse manualmente
-- en la base de datos si se desea sanear el estado antes o durante la migración.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- CASO 1: Vincular id_usuario en "asesor" para asesores que coinciden por email
-- con usuarios ASESOR pero tienen id_usuario NULL o desvinculado
-- -----------------------------------------------------------------------------
UPDATE "asesor" a
SET "id_usuario" = u."id"
FROM "user" u
WHERE LOWER(a."correo") = LOWER(u."email")
  AND u."role" = 'ASESOR'
  AND (a."id_usuario" IS NULL OR a."id_usuario" <> u."id");

-- -----------------------------------------------------------------------------
-- CASO 2: Reclasificar usuarios con rol 'ASESOR' a 'CLIENTE' si su email
-- coincide con un registro en "clients" y no tienen perfil de asesor
-- -----------------------------------------------------------------------------
UPDATE "user" u
SET "role" = 'CLIENTE'
WHERE u."role" = 'ASESOR'
  AND EXISTS (
    SELECT 1 FROM "clients" c 
    WHERE LOWER(c."email") = LOWER(u."email")
  )
  AND NOT EXISTS (
    SELECT 1 FROM "asesor" a 
    WHERE a."id_usuario" = u."id" OR LOWER(a."correo") = LOWER(u."email")
  );

-- -----------------------------------------------------------------------------
-- CASO 3: Crear perfil en "asesor" para usuarios con rol 'ASESOR'
-- que no tienen fila en asesor ni en clients (ej. usuarios de prueba/probes)
-- Se registran como inactivos (estado = false) para no alterar operaciones.
-- -----------------------------------------------------------------------------
INSERT INTO "asesor" ("nombre", "correo", "telefono", "estado", "id_usuario")
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
ON CONFLICT ("id_usuario") DO NOTHING;

-- -----------------------------------------------------------------------------
-- CASO 4: Homogeneizar emails entre "asesor" y "user" cuando id_usuario está
-- vinculado pero los correos difieren
-- -----------------------------------------------------------------------------
UPDATE "asesor" a
SET "correo" = LOWER(u."email")
FROM "user" u
WHERE a."id_usuario" = u."id"
  AND LOWER(a."correo") <> LOWER(u."email");

-- -----------------------------------------------------------------------------
-- OPCIONAL / ALTERNATIVA DE PURGA DE PRUEBAS:
-- Si prefieres eliminar los usuarios generados por tests en lugar de crearles
-- perfil inactivo de asesor, descomenta este bloque y comenta el CASO 3:
-- -----------------------------------------------------------------------------
-- DELETE FROM "session" WHERE "userId" IN (
--   SELECT "id" FROM "user" WHERE "email" LIKE 'test_user_%@riwi.com'
--     OR "email" LIKE '%_probe_%@example.test'
--     OR "email" LIKE 'verify_%@example.test'
--     OR "email" LIKE 'node_%@example.test'
-- );
-- DELETE FROM "account" WHERE "userId" IN (
--   SELECT "id" FROM "user" WHERE "email" LIKE 'test_user_%@riwi.com'
--     OR "email" LIKE '%_probe_%@example.test'
--     OR "email" LIKE 'verify_%@example.test'
--     OR "email" LIKE 'node_%@example.test'
-- );
-- DELETE FROM "user" WHERE "email" LIKE 'test_user_%@riwi.com'
--   OR "email" LIKE '%_probe_%@example.test'
--   OR "email" LIKE 'verify_%@example.test'
--   OR "email" LIKE 'node_%@example.test';

-- -----------------------------------------------------------------------------
-- VERIFICACIÓN FINAL ANTES DE CONFIRMAR
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_remaining_unmatched text;
BEGIN
    SELECT string_agg(format('id=%s, email=%s, role=%s', u."id", u."email", u."role"), '; ')
    INTO v_remaining_unmatched
    FROM "user" u
    WHERE (
        u."role" = 'ASESOR'
        AND NOT EXISTS (SELECT 1 FROM "asesor" a WHERE a."id_usuario" = u."id")
    ) OR (
        u."role" = 'CLIENTE'
        AND NOT EXISTS (SELECT 1 FROM "clients" c WHERE LOWER(c."email") = LOWER(u."email"))
    );

    IF v_remaining_unmatched IS NOT NULL THEN
        RAISE EXCEPTION 'Aún quedan usuarios sin perfil emparejado: %. Abortando transacción.', v_remaining_unmatched;
    END IF;
END $$;

COMMIT;
