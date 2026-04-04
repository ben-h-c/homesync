export function up(knex) {
  return knex.schema.createTable('contractor_jobs', (table) => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('proposal_id').references('id').inTable('proposals');
    table.integer('lead_id').references('id').inTable('contractor_leads');
    table.integer('subdivision_id').references('id').inTable('subdivisions');
    table.text('title');
    table.text('service_type');
    table.text('status').defaultTo('scheduled'); // scheduled, in_progress, completed, cancelled
    table.integer('total_homes');
    table.integer('homes_completed').defaultTo(0);
    table.float('total_revenue');
    table.date('start_date');
    table.date('end_date');
    table.timestamp('completed_at');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['user_id']);
    table.index(['status']);
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists('contractor_jobs');
}
