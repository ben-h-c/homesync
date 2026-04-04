export async function up(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.integer('ai_credits_used').defaultTo(0);
    t.timestamp('ai_credits_reset_at').nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('ai_credits_used');
    t.dropColumn('ai_credits_reset_at');
  });
}
