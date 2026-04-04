export async function up(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.float('user_latitude').nullable();
    t.float('user_longitude').nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('user_latitude');
    t.dropColumn('user_longitude');
  });
}
