USE dhaka_bus;

-- Readable role-based DB account names
CREATE USER IF NOT EXISTS 'dhaka_runtime_rw'@'%' IDENTIFIED BY 'dhaka_runtime_rw_pass_2026';
CREATE USER IF NOT EXISTS 'dhaka_analytics_ro'@'%' IDENTIFIED BY 'dhaka_analytics_ro_pass_2026';
CREATE USER IF NOT EXISTS 'dhaka_schema_admin'@'%' IDENTIFIED BY 'dhaka_schema_admin_pass_2026';

GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE
  ON dhaka_bus.* TO 'dhaka_runtime_rw'@'%';

GRANT SELECT, SHOW VIEW
  ON dhaka_bus.* TO 'dhaka_analytics_ro'@'%';

GRANT SELECT, INSERT, UPDATE, DELETE,
      CREATE, ALTER, DROP, INDEX,
      REFERENCES, CREATE VIEW, SHOW VIEW,
      CREATE ROUTINE, ALTER ROUTINE, EXECUTE,
      TRIGGER, EVENT
  ON dhaka_bus.* TO 'dhaka_schema_admin'@'%';

FLUSH PRIVILEGES;
