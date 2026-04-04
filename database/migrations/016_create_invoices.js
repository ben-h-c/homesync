export function up(knex) {
  return knex.schema
    .createTable('invoices', (table) => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('job_id').references('id').inTable('contractor_jobs');
      table.text('invoice_number').unique();
      table.text('customer_name');
      table.text('customer_email');
      table.text('customer_address');
      table.text('customer_phone');
      table.integer('subdivision_id').references('id').inTable('subdivisions');
      table.integer('contact_id').references('id').inTable('contacts');
      table.text('status').defaultTo('draft'); // draft, sent, paid, overdue, cancelled
      table.date('issue_date');
      table.date('due_date');
      table.float('subtotal').defaultTo(0);
      table.float('tax_rate').defaultTo(0);
      table.float('tax_amount').defaultTo(0);
      table.float('total').defaultTo(0);
      table.float('amount_paid').defaultTo(0);
      table.text('notes');
      table.timestamp('sent_at');
      table.timestamp('paid_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.index(['user_id']);
      table.index(['status']);
    })
    .createTable('invoice_line_items', (table) => {
      table.increments('id').primary();
      table.integer('invoice_id').references('id').inTable('invoices').onDelete('CASCADE');
      table.text('service');
      table.text('description');
      table.float('quantity').defaultTo(1);
      table.float('unit_price');
      table.float('amount');
      table.integer('sort_order').defaultTo(0);
    });
}

export function down(knex) {
  return knex.schema
    .dropTableIfExists('invoice_line_items')
    .dropTableIfExists('invoices');
}
