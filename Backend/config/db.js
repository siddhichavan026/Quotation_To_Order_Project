// config/db.js
// Creates a MySQL connection pool using mysql2 and exposes it for use
// in controllers. A pool is used instead of a single connection so that
// multiple requests can be handled at the same time.

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Return DATE columns (e.g. quotations.valid_until) as plain "YYYY-MM-DD"
  // strings instead of JS Date objects. Otherwise the JSON output is shifted
  // by the server timezone (e.g. "2026-10-04T18:30:00.000Z").
  dateStrings: ['DATE']
});

// Quick check so we know immediately if the database connection is wrong,
// instead of finding out only when the first API request comes in.
pool.getConnection()
  .then((connection) => {
    console.log('Connected to MySQL database successfully.');
    connection.release();
  })
  .catch((err) => {
    console.error('Failed to connect to MySQL database:', err.message);
  });

module.exports = pool;