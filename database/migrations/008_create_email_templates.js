export function up(knex) {
  return knex.schema.createTable('email_templates', (t) => {
    t.increments('id').primary();
    t.text('name').unique().notNullable();
    t.text('subject_template').notNullable();
    t.text('body_html_template').notNullable();
    t.text('body_text_template');
    t.text('category');
    t.text('description');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists('email_templates');
}
