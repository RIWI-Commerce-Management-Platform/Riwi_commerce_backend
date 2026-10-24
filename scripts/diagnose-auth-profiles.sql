-- =============================================================================
-- DIAGNÓSTICO DE INTEGRIDAD PRE-MIGRACIÓN 1792686000000-LinkAuthUsersToProfiles
-- =============================================================================
-- Este script es de SOLO LECTURA (únicamente sentencias SELECT).
-- Su objetivo es identificar las inconsistencias en las tablas "user", "asesor"
-- y "clients" que provocan el fallo del bloque DO $$ en la migración.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Usuarios con rol 'ASESOR' sin perfil vinculado en la tabla "asesor"
-- -----------------------------------------------------------------------------
-- Causa de fallo: La migración exige que todo usuario ASESOR esté enlazado
-- a exactamente un registro de asesor mediante a."id_usuario" = u."id".
-- Esta consulta además indica si ya existe un asesor con el mismo correo
-- (lo que implicaría que solo falta poblar asesor.id_usuario) o si el usuario
-- coincide con algún registro en "clients".
-- -----------------------------------------------------------------------------
SELECT 
    u.id AS auth_user_id,
    u.name AS auth_user_name,
    u.email AS auth_user_email,
    u.role AS auth_user_role,
    a_by_email.id_asesor AS matched_asesor_id_by_email,
    a_by_email.correo AS matched_asesor_email,
    a_by_email.id_usuario AS matched_asesor_current_id_usuario,
    c_by_email.client_count AS matching_clients_count,
    CASE 
        WHEN a_by_email.id_asesor IS NOT NULL AND a_by_email.id_usuario IS NULL THEN
            'Asesor existe por email pero tiene id_usuario NULL (requiere vinculación)'
        WHEN a_by_email.id_asesor IS NOT NULL AND a_by_email.id_usuario <> u.id THEN
            'Asesor existe por email pero su id_usuario apunta a otro usuario'
        WHEN c_by_email.client_count > 0 THEN
            'Usuario con rol ASESOR pero existe en clients (debería ser CLIENTE)'
        ELSE
            'Usuario ASESOR huérfano: sin registro en asesor ni en clients'
    END AS diagnostico
FROM "user" u
LEFT JOIN "asesor" a_by_id 
    ON a_by_id.id_usuario = u.id
LEFT JOIN "asesor" a_by_email 
    ON LOWER(a_by_email.correo) = LOWER(u.email)
LEFT JOIN (
    SELECT LOWER(email) AS email_lower, COUNT(*) AS client_count
    FROM "clients"
    GROUP BY LOWER(email)
) c_by_email 
    ON c_by_email.email_lower = LOWER(u.email)
WHERE u.role = 'ASESOR'
  AND a_by_id.id_asesor IS NULL
ORDER BY u.email;

-- -----------------------------------------------------------------------------
-- 2. Usuarios con rol 'CLIENTE' sin perfil en la tabla "clients"
-- -----------------------------------------------------------------------------
-- Causa de fallo: Todo usuario CLIENTE debe enlazarse a un perfil en "clients".
-- En la base de datos pre-migración (tras rollback), "clients" vincula por LOWER(email).
-- -----------------------------------------------------------------------------
SELECT 
    u.id AS auth_user_id,
    u.name AS auth_user_name,
    u.email AS auth_user_email,
    u.role AS auth_user_role,
    'Usuario CLIENTE sin coincidencia por email en la tabla clients' AS diagnostico
FROM "user" u
WHERE u.role = 'CLIENTE'
  AND NOT EXISTS (
    SELECT 1 
    FROM "clients" c 
    WHERE LOWER(c.email) = LOWER(u.email)
  )
ORDER BY u.email;

-- -----------------------------------------------------------------------------
-- 3. Usuarios con roles distintos de ADMIN, ADMINISTRADOR, ASESOR, CLIENTE
-- -----------------------------------------------------------------------------
-- Causa de atención: Identifica roles inesperados o transicionales.
-- NOTA: Si aparecen usuarios con 'DIRECTOR_REGIONAL', es un rol soportado
-- por el sistema (requiere zoneId), pero listado aquí por no ser uno de los
-- 4 roles base consultados.
-- -----------------------------------------------------------------------------
SELECT 
    u.id AS auth_user_id,
    u.name AS auth_user_name,
    u.email AS auth_user_email,
    u.role AS auth_user_role,
    u."zoneId" AS user_zone_id,
    CASE 
        WHEN u.role = 'DIRECTOR_REGIONAL' THEN 
            'Rol DIRECTOR_REGIONAL (válido en el sistema, verificar zoneId)'
        WHEN u.role = 'ADMIN' THEN 
            'Rol ADMIN legacy (la migración lo actualiza a ADMINISTRADOR)'
        ELSE 
            'Rol no estándar o no reconocido'
    END AS diagnostico
FROM "user" u
WHERE u.role NOT IN ('ADMIN', 'ADMINISTRADOR', 'ASESOR', 'CLIENTE')
ORDER BY u.role, u.email;

-- -----------------------------------------------------------------------------
-- 4. Emails duplicados en "clients" (ignorando mayúsculas)
-- -----------------------------------------------------------------------------
-- Causa de fallo: La migración actualiza clients.id_usuario = u.id y luego
-- crea un índice UNIQUE ("clients_id_usuario_unique"). Si un mismo correo está
-- repetido en clients, ambos registros intentarán recibir el mismo id_usuario,
-- rompiendo la restricción única.
-- -----------------------------------------------------------------------------
SELECT 
    LOWER(c.email) AS client_email_lower,
    COUNT(*) AS total_duplicados,
    string_agg(c.email, ' | ') AS emails_exactos,
    string_agg(c.nit, ' | ') AS nits_asociados,
    string_agg(c.business_name, ' | ') AS razones_sociales
FROM "clients" c
GROUP BY LOWER(c.email)
HAVING COUNT(*) > 1
ORDER BY total_duplicados DESC, client_email_lower;

-- Detalle de los registros duplicados de clients (para inspección específica):
SELECT 
    c.nit,
    c.business_name,
    c.commercial_name,
    c.email,
    c.phone,
    c.is_active
FROM "clients" c
WHERE LOWER(c.email) IN (
    SELECT LOWER(email)
    FROM "clients"
    GROUP BY LOWER(email)
    HAVING COUNT(*) > 1
)
ORDER BY LOWER(c.email), c.nit;

-- -----------------------------------------------------------------------------
-- 5. Asesores cuyo correo no coincide con el email del usuario vinculado
-- -----------------------------------------------------------------------------
-- Causa de fallo: El bloque DO $$ valida explícitamente:
-- LOWER(a."correo") = LOWER(u."email") para todo asesor vinculado.
-- -----------------------------------------------------------------------------
SELECT 
    a.id_asesor,
    a.nombre AS asesor_nombre,
    a.correo AS asesor_correo,
    a.id_usuario AS asesor_id_usuario,
    u.id AS auth_user_id,
    u.name AS auth_user_name,
    u.email AS auth_user_email,
    u.role AS auth_user_role,
    'Discrepancia entre asesor.correo y user.email' AS diagnostico
FROM "asesor" a
JOIN "user" u 
    ON a.id_usuario = u.id
WHERE LOWER(a.correo) <> LOWER(u.email)
ORDER BY a.id_asesor;

-- Verificación complementaria: Asesores que tienen id_usuario NULL pero su
-- correo coincide con un usuario de la tabla user:
SELECT 
    a.id_asesor,
    a.nombre AS asesor_nombre,
    a.correo AS asesor_correo,
    u.id AS auth_user_id,
    u.email AS auth_user_email,
    u.role AS auth_user_role,
    'Asesor con id_usuario NULL que coincide por email con un usuario' AS diagnostico
FROM "asesor" a
JOIN "user" u 
    ON LOWER(a.correo) = LOWER(u.email)
WHERE a.id_usuario IS NULL
ORDER BY a.id_asesor;

