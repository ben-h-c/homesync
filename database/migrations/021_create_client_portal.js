export function up(knex) {
  return knex.schema
    .createTable('client_portal_tokens', (table) => {
      table.increments('id').primary();
      table.integer('job_id').references('id').inTable('contractor_jobs').onDelete('CASCADE');
      table.integer('contractor_user_id').references('id').inTable('users').onDelete('CASCADE');
      table.text('client_email').notNullable();
      table.text('client_name');
      table.text('token_hash').unique().notNullable();
      table.timestamp('expires_at').notNullable();
      table.boolean('revoked').defaultTo(false);
      table.timestamp('last_accessed_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index(['job_id']);
      table.index(['token_hash']);
    })
    .createTable('client_messages', (table) => {
      table.increments('id').primary();
      table.integer('job_id').references('id').inTable('contractor_jobs').onDelete('CASCADE');
      table.text('sender_type').notNullable(); // client, contractor
      table.text('sender_name');
      table.text('message').notNullable();
      table.timestamp('read_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index(['job_id']);
    })
    .alterTable('contractor_jobs', (table) => {
      table.boolean('portal_enabled').defaultTo(false);
      table.timestamp('portal_token_sent_at');
    })
    .alterTable('change_orders', (table) => {
      table.text('client_response'); // approved, rejected, pending
      table.timestamp('client_responded_at');
      table.text('client_note');
    });
}

export function down(knex) {
  return knex.schema
    .dropTableIfExists('client_messages')
    .dropTableIfExists('client_portal_tokens')
    .alterTable('contractor_jobs', (table) => {
      table.dropColumn('portal_enabled');
      table.dropColumn('portal_token_sent_at');
    })
    .alterTable('change_orders', (table) => {
      table.dropColumn('client_response');
      table.dropColumn('client_responded_at');
      table.dropColumn('client_note');
    });
}
