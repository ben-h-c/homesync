export function up(knex) {
  return knex.schema.createTable('subdivisions', (t) => {
    t.increments('id').primary();
    t.text('name').unique().notNullable();
    t.text('zip');
    t.integer('total_homes');
    t.integer('year_built_min');
    t.integer('year_built_max');
    t.integer('year_built_mode');
    t.integer('avg_square_footage');
    t.integer('avg_assessed_value');
    t.text('hoa_name');
    t.text('hoa_management_company');
    t.text('hoa_contact_name');
    t.text('hoa_contact_email');
    t.text('hoa_contact_phone');
    t.text('hoa_meeting_schedule');
    t.text('hoa_website');
    t.float('hoa_dues_monthly');
    t.float('maintenance_urgency_score');
    t.float('hvac_pct_due');
    t.float('roof_pct_due');
    t.float('water_heater_pct_due');
    t.float('paint_pct_due');
    t.text('pipeline_stage').defaultTo('research');
    t.text('pipeline_notes');
    t.timestamp('last_contacted');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists('subdivisions');
}
