export function up(knex) {
  return knex.schema.createTable('emails', (t) => {
    t.increments('id').primary();
    t.integer('contact_id').references('id').inTable('contacts');
    t.text('to_email').notNullable();
    t.text('to_name');
    t.text('from_email').defaultTo('hello@homesync.com');
    t.text('subject').notNullable();
    t.text('body_html').notNullable();
    t.text('body_text');
    t.text('template_used');
    t.text('status').defaultTo('sent');
    t.text('resend_id');
    t.integer('related_project_id').references('id').inTable('projects');
    t.integer('related_subdivision_id').references('id').inTable('subdivisions');
    t.timestamp('sent_at').defaultTo(knex.fn.now());
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists('emails');
}
