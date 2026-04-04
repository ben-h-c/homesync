export async function seed(knex) {
  // Only create admin if it doesn't already exist
  const existing = await knex('users').where('email', 'benjaminharriscody@gmail.com').first();
  if (existing) return;

  await knex('users').insert({
    email: 'benjaminharriscody@gmail.com',
    password_hash: '$2b$12$QxXKFcApVnTTuUCyuLsCdebAYnTUAbv.HHPjdhvHsNs3JyBteFVLO',
    first_name: 'Ben',
    last_name: 'Cody',
    role: 'admin',
    subscription_tier: 'enterprise',
    subscription_status: 'active',
    metro_areas: '["atlanta"]',
  });
}
