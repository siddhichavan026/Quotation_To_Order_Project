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
  dateStrings: ['DATE']
});

pool.getConnection()
  .then((connection) => {
    console.log('Connected to MySQL database successfully.');
    connection.release();
  })
  .catch((err) => {
    console.error('Failed to connect to MySQL database:', err.message);
  });

module.exports = pool;