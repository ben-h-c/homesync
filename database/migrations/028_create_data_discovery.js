export async function up(knex) {
  await knex.schema.createTable('data_discovery_jobs', (t) => {
    t.increments('id').primary();
    t.integer('user_id').nullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('status').defaultTo('pending'); // pending, running, completed, failed
    t.text('zip_codes'); // JSON array of ZIP codes to search
    t.integer('results_count').defaultTo(0);
    t.text('results'); // JSON array of discovered subdivision objects
    t.text('error_message').nullable();
    t.timestamp('started_at').nullable();
    t.timestamp('completed_at').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('data_discovery_jobs');
}
