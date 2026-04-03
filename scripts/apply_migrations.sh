#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-$ROOT_DIR/database/migrations}"

required_vars=(DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME)
for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required environment variable: $var_name" >&2
    exit 1
  fi
done

if ! command -v mysql >/dev/null 2>&1; then
  echo "mysql client is required but not installed." >&2
  exit 1
fi

MYSQL_ARGS=(
  --host="$DB_HOST"
  --port="$DB_PORT"
  --user="$DB_USER"
  --password="$DB_PASSWORD"
  "$DB_NAME"
)

if [[ -n "${DB_SSL_MODE:-}" ]]; then
  MYSQL_ARGS+=("--ssl-mode=$DB_SSL_MODE")
fi

if [[ -n "${DB_SSL_CA_PATH:-}" ]]; then
  MYSQL_ARGS+=("--ssl-ca=$DB_SSL_CA_PATH")
fi

run_mysql() {
  mysql "${MYSQL_ARGS[@]}" "$@"
}

echo "Ensuring schema_migrations table exists..."
run_mysql -e "
CREATE TABLE IF NOT EXISTS schema_migrations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  filename VARCHAR(255) NOT NULL UNIQUE,
  checksum VARCHAR(64) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);"

shopt -s nullglob
migration_files=("$MIGRATIONS_DIR"/*.sql)

if [[ ${#migration_files[@]} -eq 0 ]]; then
  echo "No migration files found in $MIGRATIONS_DIR"
  exit 0
fi

for migration_file in "${migration_files[@]}"; do
  filename="$(basename "$migration_file")"
  checksum="$(shasum -a 256 "$migration_file" | awk '{print $1}')"

  applied_row="$(run_mysql --batch --skip-column-names -e \
    "SELECT checksum FROM schema_migrations WHERE filename = '$filename' LIMIT 1;" || true)"

  if [[ -n "$applied_row" ]]; then
    if [[ "$applied_row" != "$checksum" ]]; then
      echo "Migration checksum mismatch for $filename. Create a new migration instead of editing an applied one." >&2
      exit 1
    fi

    echo "Skipping already applied migration: $filename"
    continue
  fi

  echo "Applying migration: $filename"
  run_mysql < "$migration_file"
  run_mysql -e \
    "INSERT INTO schema_migrations (filename, checksum) VALUES ('$filename', '$checksum');"
done

echo "All migrations applied successfully."
