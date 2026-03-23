// Database configuration file
// This connects the Node.js app to MySQL database

const mysql = require('mysql2/promise');

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
});

// Export the pool so other files can use it
module.exports = pool;
