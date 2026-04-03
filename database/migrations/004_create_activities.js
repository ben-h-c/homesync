export function up(knex) {
  return knex.schema.createTable('activities', (t) => {
    t.increments('id').primary();
    t.integer('contact_id').references('id').inTable('contacts');
    t.integer('subdivision_id').references('id').inTable('subdivisions');
    t.integer('project_id').references('id').inTable('projects');
    t.text('type').notNullable();
    t.text('subject');
    t.text('description');
    t.text('outcome');
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.index('contact_id');
    t.index('subdivision_id');
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists('activities');
}
