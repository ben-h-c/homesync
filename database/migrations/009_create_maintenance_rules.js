export function up(knex) {
  return knex.schema.createTable('maintenance_rules', (t) => {
    t.increments('id').primary();
    t.text('system_name').unique().notNullable();
    t.text('display_name').notNullable();
    t.integer('avg_lifespan_years').notNullable();
    t.integer('warning_years_before').defaultTo(2);
    t.integer('critical_years_after').defaultTo(2);
    t.float('avg_replacement_cost_low');
    t.float('avg_replacement_cost_high');
    t.float('avg_maintenance_cost');
    t.float('group_discount_typical').defaultTo(0.30);
    t.text('service_type');
    t.boolean('is_recurring').defaultTo(false);
    t.integer('recurrence_months');
    t.text('notes');
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists('maintenance_rules');
}
