const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'crm',
  password: 'crmpassword',
  database: 'crm',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool.promise();
