export function up(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.text('user_type').defaultTo('contractor');
    table.text('trade_category'); // hvac, roofing, plumbing, painting, general, etc.
    table.integer('service_radius_miles').defaultTo(25);
    table.text('zip_code');
    table.text('license_number');
    table.boolean('insurance_verified').defaultTo(false);
    table.text('business_description');
    table.float('default_tax_rate').defaultTo(0);
    table.text('payment_terms').defaultTo('Net 30');
  });
}

export function down(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('user_type');
    table.dropColumn('trade_category');
    table.dropColumn('service_radius_miles');
    table.dropColumn('zip_code');
    table.dropColumn('license_number');
    table.dropColumn('insurance_verified');
    table.dropColumn('business_description');
    table.dropColumn('default_tax_rate');
    table.dropColumn('payment_terms');
  });
}
