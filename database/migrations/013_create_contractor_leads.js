export function up(knex) {
  return knex.schema.createTable('contractor_leads', (table) => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('subdivision_id').references('id').inTable('subdivisions');
    table.integer('contact_id').references('id').inTable('contacts');
    table.text('stage').defaultTo('new'); // new, contacted, proposal_sent, negotiating, won, lost
    table.text('service_type');
    table.float('estimated_value');
    table.integer('estimated_homes');
    table.text('notes');
    table.date('next_follow_up');
    table.date('won_date');
    table.text('lost_reason');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['user_id']);
    table.index(['stage']);
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists('contractor_leads');
}
