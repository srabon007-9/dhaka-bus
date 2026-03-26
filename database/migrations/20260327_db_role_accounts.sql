USE dhaka_bus;

-- =====================================================
-- Role-based database accounts (least privilege)
-- =====================================================
-- NOTE: Rotate these passwords in production.

CREATE USER IF NOT EXISTS 'dhaka_app_rw'@'%' IDENTIFIED BY 'dhaka_rw_pass_2026';
CREATE USER IF NOT EXISTS 'dhaka_app_ro'@'%' IDENTIFIED BY 'dhaka_ro_pass_2026';
CREATE USER IF NOT EXISTS 'dhaka_migration_admin'@'%' IDENTIFIED BY 'dhaka_migrate_pass_2026';

-- Application read-write user: only what runtime API needs
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE
  ON dhaka_bus.* TO 'dhaka_app_rw'@'%';

-- Optional read-only analytics/reporting user
GRANT SELECT, SHOW VIEW
  ON dhaka_bus.* TO 'dhaka_app_ro'@'%';

-- Migration/admin user: broad DDL + data privileges (still scoped to one DB)
GRANT SELECT, INSERT, UPDATE, DELETE,
      CREATE, ALTER, DROP, INDEX,
      REFERENCES, CREATE VIEW, SHOW VIEW,
      CREATE ROUTINE, ALTER ROUTINE, EXECUTE,
      TRIGGER, EVENT
  ON dhaka_bus.* TO 'dhaka_migration_admin'@'%';

FLUSH PRIVILEGES;
