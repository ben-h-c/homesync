import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @type {import('knex').Knex.Config}
 */
const config = {
  client: 'better-sqlite3',
  connection: {
    filename: resolve(__dirname, 'homesync.db')
  },
  useNullAsDefault: true,
  migrations: {
    directory: resolve(__dirname, 'migrations')
  },
  seeds: {
    directory: resolve(__dirname, 'seeds')
  }
};

export default config;
