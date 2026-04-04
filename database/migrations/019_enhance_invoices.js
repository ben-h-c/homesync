export function up(knex) {
  return knex.schema
    .alterTable('invoices', (table) => {
      table.float('discount_amount').defaultTo(0);
      table.text('discount_type').defaultTo('flat'); // flat, percent
      table.text('payment_terms').defaultTo('net_30'); // net_15, net_30, net_45, due_on_receipt, custom
      table.text('payment_method'); // check, cash, card, bank_transfer, other
      table.text('viewed_at'); // when client first viewed
    })
    .createTable('invoice_status_history', (table) => {
      table.increments('id').primary();
      table.integer('invoice_id').references('id').inTable('invoices').onDelete('CASCADE');
      table.text('from_status');
      table.text('to_status');
      table.text('note');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index(['invoice_id']);
    });
}

export function down(knex) {
  return knex.schema
    .dropTableIfExists('invoice_status_history')
    .alterTable('invoices', (table) => {
      table.dropColumn('discount_amount');
      table.dropColumn('discount_type');
      table.dropColumn('payment_terms');
      table.dropColumn('payment_method');
      table.dropColumn('viewed_at');
    });
}
