export function up(knex) {
  return knex.schema.alterTable('subdivisions', (table) => {
    table.float('latitude');
    table.float('longitude');
  });
}

export function down(knex) {
  return knex.schema.alterTable('subdivisions', (table) => {
    table.dropColumn('latitude');
    table.dropColumn('longitude');
  });
}
