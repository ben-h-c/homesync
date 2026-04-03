export function up(knex) {
  return knex.schema.createTable('projects', (t) => {
    t.increments('id').primary();
    t.text('name').notNullable();
    t.integer('subdivision_id').references('id').inTable('subdivisions');
    t.text('service_type').notNullable();
    t.integer('contractor_id').references('id').inTable('contacts');
    t.text('status').defaultTo('planning');
    t.float('retail_price');
    t.float('group_price');
    t.float('coordination_fee');
    t.float('total_price_to_homeowner');
    t.integer('total_eligible_homes');
    t.integer('homes_signed_up').defaultTo(0);
    t.integer('homes_completed').defaultTo(0);
    t.date('sign_up_deadline');
    t.date('service_start_date');
    t.date('service_end_date');
    t.float('total_revenue').defaultTo(0);
    t.float('total_contractor_cost').defaultTo(0);
    t.text('notes');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists('projects');
}
