export function up(knex) {
  return knex.schema.createTable('properties', (t) => {
    t.increments('id').primary();
    t.text('parcel_id').unique().notNullable();
    t.text('address').notNullable();
    t.text('city').defaultTo('Cumming');
    t.text('state').defaultTo('GA');
    t.text('zip').notNullable();
    t.text('subdivision');
    t.text('owner_name');
    t.text('owner_mailing_address');
    t.integer('year_built');
    t.integer('square_footage');
    t.integer('bedrooms');
    t.float('bathrooms');
    t.integer('assessed_value');
    t.float('lot_size_acres');
    t.text('property_type').defaultTo('Single Family');
    t.float('latitude');
    t.float('longitude');
    t.integer('hvac_year_installed');
    t.integer('water_heater_year');
    t.integer('roof_year');
    t.integer('exterior_paint_year');
    t.timestamp('last_updated').defaultTo(knex.fn.now());
    t.text('notes');
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.index('subdivision');
    t.index('zip');
    t.index('year_built');
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists('properties');
}
