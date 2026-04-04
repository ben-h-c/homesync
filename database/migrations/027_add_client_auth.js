export async function up(knex) {
  await knex.schema.createTable('client_accounts', (t) => {
    t.increments('id').primary();
    t.string('email').notNullable().unique();
    t.string('password_hash').nullable();
    t.string('first_name').nullable();
    t.string('last_name').nullable();
    t.string('phone').nullable();
    t.timestamp('last_login_at').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('client_portal_tokens', (t) => {
    t.integer('client_account_id').nullable().references('id').inTable('client_accounts').onDelete('SET NULL');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('client_portal_tokens', (t) => {
    t.dropColumn('client_account_id');
  });
  await knex.schema.dropTableIfExists('client_accounts');
}
