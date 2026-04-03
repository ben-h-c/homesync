export async function seed(knex) {
  await knex('email_templates').del();
  await knex('email_templates').insert([
    {
      name: 'hoa_intro_pitch',
      category: 'hoa',
      description: 'Initial outreach to HOA board',
      subject_template: 'Free Maintenance Forecast for {{subdivision_name}}',
      body_html_template: `<p>Hi {{contact_first_name}},</p>
<p>I'm reaching out because I specialize in helping neighborhoods like <strong>{{subdivision_name}}</strong> save money on home maintenance through group-rate coordination.</p>
<p>Based on public property records, most homes in {{subdivision_name}} were built around <strong>{{year_built}}</strong>, which means several major systems — HVAC, water heaters, exterior paint — are approaching key maintenance milestones at the same time.</p>
<p>I've prepared a <strong>free Neighborhood Maintenance Forecast</strong> for {{subdivision_name}} that shows:</p>
<ul>
<li>Which systems are due for service in the next 1-3 years</li>
<li>How many homes are affected</li>
<li>Estimated costs at retail vs. group rates (typically 25-40% savings)</li>
</ul>
<p>Would you be open to a quick 15-minute call, or could I present this at your next board meeting?</p>
<p>Best regards,<br>{{your_name}}<br>{{business_name}}<br>{{your_phone}}</p>`,
      body_text_template: 'Hi {{contact_first_name}},\n\nI specialize in helping neighborhoods like {{subdivision_name}} save money on home maintenance through group-rate coordination.\n\nBased on public records, most homes in {{subdivision_name}} were built around {{year_built}}, meaning several major systems are approaching end-of-life simultaneously.\n\nI\'ve prepared a free Neighborhood Maintenance Forecast. Would you be open to a quick call?\n\nBest,\n{{your_name}}\n{{your_phone}}'
    },
    {
      name: 'hoa_follow_up',
      category: 'hoa',
      description: 'Follow-up after no response',
      subject_template: 'Following up — {{subdivision_name}} Maintenance Forecast',
      body_html_template: `<p>Hi {{contact_first_name}},</p>
<p>I wanted to follow up on my previous email about the maintenance forecast I prepared for {{subdivision_name}}.</p>
<p>The key finding: <strong>{{num_homes_needing_service}} homes</strong> in your neighborhood are approaching critical maintenance windows for {{top_service_needed}}, and group coordination could save each homeowner an estimated <strong>\${{estimated_savings_per_home}}</strong>.</p>
<p>I'd love to share the full report — no obligation. Would a quick call or email exchange work?</p>
<p>Best,<br>{{your_name}}<br>{{your_phone}}</p>`,
      body_text_template: 'Hi {{contact_first_name}},\n\nFollowing up on the maintenance forecast for {{subdivision_name}}. Key finding: {{num_homes_needing_service}} homes need {{top_service_needed}} service, with potential savings of ${{estimated_savings_per_home}} each.\n\nWould a quick call work?\n\n{{your_name}}\n{{your_phone}}'
    },
    {
      name: 'hoa_meeting_request',
      category: 'hoa',
      description: 'Request to present at board meeting',
      subject_template: 'Quick presentation for {{subdivision_name}} board?',
      body_html_template: `<p>Hi {{contact_first_name}},</p>
<p>Thank you for your interest in the maintenance forecast for {{subdivision_name}}. I'd love to present the full findings to your board.</p>
<p>The presentation takes about 15 minutes and covers:</p>
<ul>
<li>System-by-system maintenance timeline for your homes</li>
<li>Cost comparison: retail vs. group rates</li>
<li>How the coordination process works (zero cost to the HOA)</li>
</ul>
<p>When is your next board meeting? I'm happy to work around your schedule.</p>
<p>Best,<br>{{your_name}}<br>{{your_phone}}</p>`,
      body_text_template: 'Hi {{contact_first_name}},\n\nI\'d love to present the maintenance forecast to the {{subdivision_name}} board. It takes about 15 minutes. When is your next meeting?\n\n{{your_name}}\n{{your_phone}}'
    },
    {
      name: 'homeowner_offer',
      category: 'homeowner',
      description: 'Offer sent to homeowners after HOA approves',
      subject_template: 'Save ${{estimated_savings}} on {{service_name}} — {{subdivision_name}} Group Rate',
      body_html_template: '<p>Hi {{contact_first_name}},</p>' +
        '<p>Great news for {{subdivision_name}} homeowners! Your HOA board has approved a group-rate {{service_name}} program for the neighborhood.</p>' +
        '<p><strong>Here\'s the deal:</strong></p>' +
        '<ul>' +
        '<li>Retail price: ${{retail_price}}</li>' +
        '<li>Your group rate: <strong>${{group_price}}</strong></li>' +
        '<li>You save: <strong>${{estimated_savings}}</strong></li>' +
        '</ul>' +
        '<p>The contractor is licensed, insured, and has been vetted by your HOA board. Sign-ups close on {{deadline}}.</p>' +
        '<p>To sign up, simply reply to this email or call me at {{your_phone}}.</p>' +
        '<p>Best,<br>{{your_name}}<br>{{business_name}}<br>{{your_phone}}</p>',
      body_text_template: 'Hi {{contact_first_name}},\n\n{{subdivision_name}} HOA has approved a group-rate {{service_name}} program.\n\nRetail: ${{retail_price}} | Group rate: ${{group_price}} | You save: ${{estimated_savings}}\n\nSign-ups close {{deadline}}. Reply or call {{your_phone}} to sign up.\n\n{{your_name}}'
    },
    {
      name: 'contractor_inquiry',
      category: 'contractor',
      description: 'Initial outreach to a contractor',
      subject_template: 'Group rate inquiry — {{num_homes}} homes in {{subdivision_name}}',
      body_html_template: `<p>Hi {{contact_first_name}},</p>
<p>I coordinate group maintenance projects for residential neighborhoods in Forsyth County, GA, and I'm looking for a licensed {{service_name}} contractor for an upcoming project.</p>
<p><strong>Project details:</strong></p>
<ul>
<li>Subdivision: {{subdivision_name}}</li>
<li>Estimated homes: {{num_homes}}</li>
<li>Service: {{service_name}}</li>
<li>Timeline: {{timeline}}</li>
</ul>
<p>Because we bring volume ({{num_homes}} homes in one neighborhood), we're looking for a group rate. Would you be interested in discussing?</p>
<p>Best,<br>{{your_name}}<br>{{business_name}}<br>{{your_phone}}</p>`,
      body_text_template: 'Hi {{contact_first_name}},\n\nI coordinate group maintenance in Forsyth County. Looking for a {{service_name}} contractor for {{num_homes}} homes in {{subdivision_name}}.\n\nInterested in discussing group rates?\n\n{{your_name}}\n{{your_phone}}'
    },
    {
      name: 'contractor_confirmation',
      category: 'contractor',
      description: 'Confirm project details with contractor',
      subject_template: 'Confirmed: {{project_name}} — {{num_homes}} homes',
      body_html_template: '<p>Hi {{contact_first_name}},</p>' +
        '<p>This confirms the details for our upcoming project:</p>' +
        '<ul>' +
        '<li><strong>Project:</strong> {{project_name}}</li>' +
        '<li><strong>Subdivision:</strong> {{subdivision_name}}</li>' +
        '<li><strong>Homes signed up:</strong> {{num_homes}}</li>' +
        '<li><strong>Agreed rate:</strong> ${{group_price}} per home</li>' +
        '<li><strong>Service dates:</strong> {{service_start}} to {{service_end}}</li>' +
        '</ul>' +
        '<p>I\'ll send you the full address list and schedule by {{schedule_date}}. Please confirm receipt.</p>' +
        '<p>Best,<br>{{your_name}}<br>{{your_phone}}</p>',
      body_text_template: 'Hi {{contact_first_name}},\n\nConfirming: {{project_name}} in {{subdivision_name}}, {{num_homes}} homes at ${{group_price}}/home, {{service_start}} to {{service_end}}.\n\nFull schedule coming by {{schedule_date}}.\n\n{{your_name}}'
    },
    {
      name: 'project_completion_summary',
      category: 'hoa',
      description: 'Summary sent to HOA after project completes',
      subject_template: '{{subdivision_name}} {{service_name}} Complete — Results & Savings',
      body_html_template: '<p>Hi {{contact_first_name}},</p>' +
        '<p>I\'m happy to report that the {{service_name}} project for {{subdivision_name}} is now complete!</p>' +
        '<p><strong>Results:</strong></p>' +
        '<ul>' +
        '<li>Homes serviced: {{homes_completed}}</li>' +
        '<li>Total savings vs. retail: <strong>${{total_savings}}</strong></li>' +
        '<li>Average savings per home: ${{avg_savings_per_home}}</li>' +
        '</ul>' +
        '<p>Thank you for partnering with us. I\'d love to discuss what other maintenance services might benefit your neighborhood next.</p>' +
        '<p>Best,<br>{{your_name}}<br>{{business_name}}<br>{{your_phone}}</p>',
      body_text_template: 'Hi {{contact_first_name}},\n\nThe {{service_name}} project for {{subdivision_name}} is complete!\n\nHomes serviced: {{homes_completed}}\nTotal savings: ${{total_savings}}\nPer home: ${{avg_savings_per_home}}\n\nThank you!\n{{your_name}}'
    },
  ]);
}
