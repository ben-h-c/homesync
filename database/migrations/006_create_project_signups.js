export function up(knex) {
  return knex.schema.createTable('project_signups', (t) => {
    t.increments('id').primary();
    t.integer('project_id').references('id').inTable('projects').notNullable();
    t.integer('property_id').references('id').inTable('properties');
    t.integer('contact_id').references('id').inTable('contacts');
    t.text('homeowner_name').notNullable();
    t.text('homeowner_email');
    t.text('homeowner_phone');
    t.text('address').notNullable();
    t.text('status').defaultTo('signed_up');
    t.date('scheduled_date');
    t.date('completed_date');
    t.text('payment_status').defaultTo('pending');
    t.float('amount_charged');
    t.text('notes');
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.index('project_id');
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists('project_signups');
}
