export function up(knex) {
  return knex.schema
    .alterTable('contractor_jobs', (table) => {
      table.text('client_name');
      table.text('client_email');
      table.text('client_phone');
      table.text('client_address');
      table.text('description');
      table.float('estimated_cost');
      table.text('photos'); // JSON array of photo URLs/descriptions
    })
    .createTable('change_orders', (table) => {
      table.increments('id').primary();
      table.integer('job_id').references('id').inTable('contractor_jobs').onDelete('CASCADE');
      table.integer('user_id').references('id').inTable('users');
      table.text('change_order_number');
      table.text('description').notNullable();
      table.float('cost_impact').defaultTo(0);
      table.text('reason');
      table.text('status').defaultTo('proposed'); // proposed, approved, rejected
      table.timestamp('approved_at');
      table.text('approved_by');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.index(['job_id']);
    })
    .createTable('job_activities', (table) => {
      table.increments('id').primary();
      table.integer('job_id').references('id').inTable('contractor_jobs').onDelete('CASCADE');
      table.integer('user_id').references('id').inTable('users');
      table.text('type'); // status_change, note, photo, change_order, invoice
      table.text('description');
      table.text('old_value');
      table.text('new_value');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index(['job_id']);
    });
}

export function down(knex) {
  return knex.schema
    .dropTableIfExists('job_activities')
    .dropTableIfExists('change_orders')
    .alterTable('contractor_jobs', (table) => {
      table.dropColumn('client_name');
      table.dropColumn('client_email');
      table.dropColumn('client_phone');
      table.dropColumn('client_address');
      table.dropColumn('description');
      table.dropColumn('estimated_cost');
      table.dropColumn('photos');
    });
}
