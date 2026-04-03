export function up(knex) {
  return knex.schema.createTable('contacts', (t) => {
    t.increments('id').primary();
    t.text('type').notNullable();
    t.text('first_name').notNullable();
    t.text('last_name');
    t.text('email');
    t.text('phone');
    t.text('company');
    t.text('title');
    t.text('subdivision');
    t.text('address');
    t.text('contractor_services');
    t.text('contractor_license_number');
    t.boolean('contractor_insurance_verified').defaultTo(false);
    t.float('contractor_rating');
    t.float('contractor_group_rate_discount');
    t.text('status').defaultTo('active');
    t.text('source');
    t.text('tags');
    t.text('notes');
    t.timestamp('last_contacted');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());

    t.index('type');
    t.index('subdivision');
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists('contacts');
}
