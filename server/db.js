const knex = require('knex');
const path = require('path');

const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: process.env.DATABASE_PATH || path.resolve(__dirname, '..', 'database', 'homesync.db')
  },
  useNullAsDefault: true
});

module.exports = db;
