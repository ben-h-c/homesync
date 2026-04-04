export function up(knex) {
  return knex.schema
    .alterTable('users', (table) => {
      table.text('address');
      table.text('city');
      table.text('state');
      table.text('logo_url');
      table.text('tagline');
      table.text('notification_new_leads').defaultTo('true');
      table.text('notification_invoice_payments').defaultTo('true');
      table.text('notification_client_messages').defaultTo('true');
      table.text('notification_project_updates').defaultTo('true');
    })
    .createTable('team_invites', (table) => {
      table.increments('id').primary();
      table.integer('invited_by').references('id').inTable('users').onDelete('CASCADE');
      table.text('email').notNullable();
      table.text('role').defaultTo('technician'); // admin, manager, technician
      table.text('status').defaultTo('pending'); // pending, accepted, revoked
      table.text('token_hash');
      table.timestamp('accepted_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index(['invited_by']);
    });
}

export function down(knex) {
  return knex.schema
    .dropTableIfExists('team_invites')
    .alterTable('users', (table) => {
      table.dropColumn('address');
      table.dropColumn('city');
      table.dropColumn('state');
      table.dropColumn('logo_url');
      table.dropColumn('tagline');
      table.dropColumn('notification_new_leads');
      table.dropColumn('notification_invoice_payments');
      table.dropColumn('notification_client_messages');
      table.dropColumn('notification_project_updates');
    });
}
