USE dhaka_bus;

-- Remove legacy/confusing database user names after readable accounts are in place.
DROP USER IF EXISTS 'dhaka_app_rw'@'%';
DROP USER IF EXISTS 'dhaka_app_ro'@'%';
DROP USER IF EXISTS 'dhaka_migration_admin'@'%';

FLUSH PRIVILEGES;
