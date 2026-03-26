// MySQL connection pool
const mysql = require('mysql2/promise');

const isTruthy = (value) => String(value || '').toLowerCase() === 'true';
const isFalsy = (value) => String(value || '').toLowerCase() === 'false';

const shouldForceSslByHost = (host) => {
  const normalized = String(host || '').toLowerCase();
  return normalized.includes('tidbcloud.com') || normalized.includes('psdb.cloud');
};

const buildSslConfig = () => {
  const host = process.env.DB_HOST || 'mysql';
  const sslEnabled = isTruthy(process.env.DB_SSL)
    || (process.env.DB_SSL === undefined && shouldForceSslByHost(host));

  if (!sslEnabled) {
    return undefined;
  }

  // Secure by default. Allow explicit false only when cert chain troubleshooting is needed.
  const rejectUnauthorized = isFalsy(process.env.DB_SSL_REJECT_UNAUTHORIZED)
    ? false
    : true;

  return {
    rejectUnauthorized,
  };
};

// Connection pool for efficient resource management
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'dhaka_bus',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: buildSslConfig(),
});

module.exports = pool;
