export function up(knex) {
  return knex.schema
    .createTable('campaigns', (table) => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.text('name').notNullable();
      table.text('subject');
      table.text('body_html');
      table.integer('template_id').references('id').inTable('email_templates');
      table.text('status').defaultTo('draft'); // draft, scheduled, sending, sent, cancelled
      table.timestamp('scheduled_at');
      table.timestamp('sent_at');
      table.integer('total_recipients').defaultTo(0);
      table.integer('total_sent').defaultTo(0);
      table.integer('total_opened').defaultTo(0);
      table.integer('total_clicked').defaultTo(0);
      table.text('recipient_source'); // leads, clients, subdivision, custom
      table.text('recipient_filter'); // JSON filter criteria
      table.text('notes');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.index(['user_id']);
      table.index(['status']);
    })
    .createTable('campaign_recipients', (table) => {
      table.increments('id').primary();
      table.integer('campaign_id').references('id').inTable('campaigns').onDelete('CASCADE');
      table.text('email').notNullable();
      table.text('name');
      table.text('status').defaultTo('pending'); // pending, sent, opened, clicked, bounced
      table.timestamp('sent_at');
      table.timestamp('opened_at');
      table.index(['campaign_id']);
    })
    .createTable('marketing_plans', (table) => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.text('name');
      table.text('target_services'); // JSON array
      table.text('target_areas'); // JSON array of zips
      table.text('budget');
      table.text('goals');
      table.text('plan_content'); // JSON with quarterly actions
      table.text('status').defaultTo('active');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.index(['user_id']);
    });
}

export function down(knex) {
  return knex.schema
    .dropTableIfExists('marketing_plans')
    .dropTableIfExists('campaign_recipients')
    .dropTableIfExists('campaigns');
}
