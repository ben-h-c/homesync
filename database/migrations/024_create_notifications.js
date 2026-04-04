export async function up(knex) {
  await knex.schema.createTable('notifications', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('type').notNullable(); // client_message, invoice_paid, invoice_viewed, change_order_response, portal_accessed, new_lead
    t.string('title').notNullable();
    t.text('message').notNullable();
    t.string('link').nullable(); // in-app route to navigate to
    t.integer('related_job_id').nullable().references('id').inTable('contractor_jobs').onDelete('SET NULL');
    t.integer('related_invoice_id').nullable();
    t.timestamp('read_at').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index('user_id');
    t.index(['user_id', 'read_at']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('notifications');
}
