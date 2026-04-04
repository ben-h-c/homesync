export function up(knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.text('email').unique().notNullable();
    table.text('password_hash').notNullable();
    table.text('first_name').notNullable();
    table.text('last_name');
    table.text('company_name');
    table.text('phone');
    table.text('role').defaultTo('subscriber'); // subscriber, admin
    table.text('subscription_tier').defaultTo('starter'); // starter, pro, enterprise
    table.text('subscription_status').defaultTo('trialing'); // trialing, active, past_due, canceled
    table.timestamp('trial_ends_at');
    table.timestamp('subscription_started_at');
    table.timestamp('subscription_ends_at');
    table.text('stripe_customer_id');
    table.text('stripe_subscription_id');
    table.text('metro_areas').defaultTo('["atlanta"]'); // JSON array
    table.integer('subdivision_views_used').defaultTo(0);
    table.timestamp('subdivision_views_reset_at');
    table.timestamp('last_login_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists('users');
}
