export function up(knex) {
  return knex.schema.createTable('proposals', (table) => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('lead_id').references('id').inTable('contractor_leads');
    table.integer('subdivision_id').references('id').inTable('subdivisions');
    table.integer('contact_id').references('id').inTable('contacts');
    table.text('title');
    table.text('service_type');
    table.text('scope_of_work');
    table.integer('estimated_homes');
    table.float('price_per_home');
    table.float('total_amount');
    table.float('group_discount_pct');
    table.date('valid_until');
    table.text('status').defaultTo('draft'); // draft, sent, viewed, accepted, rejected, expired
    table.timestamp('sent_at');
    table.timestamp('accepted_at');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['user_id']);
    table.index(['status']);
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists('proposals');
}
