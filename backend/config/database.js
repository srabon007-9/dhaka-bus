// Database configuration file
// This connects the Node.js app to MySQL database

const mysql = require('mysql2/promise');

const isTruthy = (value) => String(value || '').toLowerCase() === 'true';

const buildSslConfig = () => {
  if (!isTruthy(process.env.DB_SSL)) {
    return undefined;
  }

  const rejectUnauthorized = isTruthy(process.env.DB_SSL_REJECT_UNAUTHORIZED);

  return {
    rejectUnauthorized,
  };
};

// Create a connection pool (better than single connection)
// A pool manages multiple connections efficiently
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql', // In Docker, service name is 'mysql'
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'dhaka_bus',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: buildSslConfig(),
});

// Export the pool so other files can use it
module.exports = pool;
