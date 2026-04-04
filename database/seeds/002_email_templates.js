export async function seed(knex) {
  await knex('email_templates').del();
  await knex('email_templates').insert([
    // ── Transactional ──
    {
      name: 'welcome',
      category: 'transactional',
      description: 'Welcome email sent after registration',
      subject_template: 'Welcome to WeDoneDoIt, {{first_name}}!',
      body_html_template: `<p>Hi {{first_name}},</p>
<p>Welcome to WeDoneDoIt! You now have access to the smartest lead-finding and business management tools built specifically for contractors.</p>
<p>Here's what you can do right away:</p>
<ul>
<li><strong>Explore the Map</strong> — Find neighborhoods where homes need your services</li>
<li><strong>Add Leads</strong> — Start building your pipeline from data-driven opportunities</li>
<li><strong>Send Invoices</strong> — Look professional and get paid faster</li>
</ul>
<p>Your 14-day free trial is active. No credit card needed.</p>
<p style="text-align:center;margin:28px 0"><a href="{{app_url}}/#/dashboard" class="btn">Go to My Dashboard</a></p>
<p>Questions? Just reply to this email — we read every message.</p>
<p>— The WeDoneDoIt Team</p>`,
      body_text_template: `Hi {{first_name}},\n\nWelcome to WeDoneDoIt! Your 14-day free trial is active.\n\nExplore the Map — Find neighborhoods where homes need your services\nAdd Leads — Start building your pipeline\nSend Invoices — Get paid faster\n\nGo to your dashboard: {{app_url}}/#/dashboard\n\nQuestions? Reply to this email.\n\n— The WeDoneDoIt Team`,
    },
    {
      name: 'password_reset',
      category: 'transactional',
      description: 'Password reset link',
      subject_template: 'Reset your WeDoneDoIt password',
      body_html_template: `<p>Hi {{first_name}},</p>
<p>We received a request to reset your password. Click the button below to create a new one:</p>
<p style="text-align:center;margin:28px 0"><a href="{{reset_url}}" class="btn">Reset My Password</a></p>
<p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.</p>
<p>— WeDoneDoIt</p>`,
      body_text_template: `Hi {{first_name}},\n\nWe received a request to reset your password. Visit this link to create a new one:\n\n{{reset_url}}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.\n\n— WeDoneDoIt`,
    },
    {
      name: 'invoice_sent',
      category: 'transactional',
      description: 'Invoice notification sent to client',
      subject_template: 'Invoice {{invoice_number}} from {{company_name}}',
      body_html_template: `<p>Hi {{customer_name}},</p>
<p>You have a new invoice from <strong>{{company_name}}</strong>.</p>
<table style="width:100%;border-collapse:collapse;margin:20px 0">
<tr style="border-bottom:1px solid #eee"><td style="padding:8px 0;color:#666">Invoice #</td><td style="padding:8px 0;text-align:right;font-weight:600">{{invoice_number}}</td></tr>
<tr style="border-bottom:1px solid #eee"><td style="padding:8px 0;color:#666">Amount Due</td><td style="padding:8px 0;text-align:right;font-weight:600;font-size:18px;color:#0E7C7B">\${{total}}</td></tr>
<tr><td style="padding:8px 0;color:#666">Due Date</td><td style="padding:8px 0;text-align:right;font-weight:600">{{due_date}}</td></tr>
</table>
{{#if payment_terms}}<p><strong>Payment Terms:</strong> {{payment_terms}}</p>{{/if}}
<p>If you have a client portal link, you can view and download the full invoice there.</p>
<p>Thank you for your business!</p>
<p>{{company_name}}<br/>{{phone}}</p>`,
      body_text_template: `Hi {{customer_name}},\n\nYou have a new invoice from {{company_name}}.\n\nInvoice #: {{invoice_number}}\nAmount Due: \${{total}}\nDue Date: {{due_date}}\n\nThank you for your business!\n\n{{company_name}}\n{{phone}}`,
    },
    {
      name: 'invoice_overdue',
      category: 'transactional',
      description: 'Overdue invoice reminder',
      subject_template: 'Reminder: Invoice {{invoice_number}} is past due',
      body_html_template: `<p>Hi {{customer_name}},</p>
<p>This is a friendly reminder that invoice <strong>{{invoice_number}}</strong> for <strong>\${{total}}</strong> was due on <strong>{{due_date}}</strong> and is now past due.</p>
<p>If you've already sent payment, please disregard this notice. Otherwise, we'd appreciate payment at your earliest convenience.</p>
<p>Questions about this invoice? Please reach out directly.</p>
<p>Thank you,<br/>{{company_name}}<br/>{{phone}}</p>`,
      body_text_template: `Hi {{customer_name}},\n\nThis is a friendly reminder that invoice {{invoice_number}} for \${{total}} was due on {{due_date}} and is now past due.\n\nIf you've already sent payment, please disregard. Otherwise, we'd appreciate payment at your earliest convenience.\n\nThank you,\n{{company_name}}\n{{phone}}`,
    },
    {
      name: 'portal_invite',
      category: 'transactional',
      description: 'Client portal access link',
      subject_template: 'View Your {{service_type}} Project — {{company_name}}',
      body_html_template: `<p>Hi {{client_name}},</p>
<p><strong>{{company_name}}</strong> has shared a project portal with you for <strong>{{project_title}}</strong>.</p>
<p>Through your portal you can:</p>
<ul>
<li>View project status and timeline</li>
<li>See and download invoices</li>
<li>Review and approve change orders</li>
<li>Message your contractor directly</li>
</ul>
<p style="text-align:center;margin:28px 0"><a href="{{portal_url}}" class="btn">View My Project</a></p>
<p style="font-size:13px;color:#666">This link is valid for 90 days. No login required.</p>
<p>Best,<br/>{{company_name}}</p>`,
      body_text_template: `Hi {{client_name}},\n\n{{company_name}} has shared a project portal with you for {{project_title}}.\n\nView project status, invoices, change orders, and message your contractor:\n\n{{portal_url}}\n\nThis link is valid for 90 days.\n\n{{company_name}}`,
    },
    {
      name: 'team_invite',
      category: 'transactional',
      description: 'Team member invitation',
      subject_template: "You're invited to join {{company_name}} on WeDoneDoIt",
      body_html_template: `<p>Hi there,</p>
<p><strong>{{inviter_name}}</strong> has invited you to join their team on WeDoneDoIt as a <strong>{{role}}</strong>.</p>
<p>WeDoneDoIt helps contractors find leads, manage projects, and grow their business. As a team member, you'll have access to shared projects and tools.</p>
<p style="text-align:center;margin:28px 0"><a href="{{register_url}}" class="btn">Accept Invitation</a></p>
<p>— WeDoneDoIt</p>`,
      body_text_template: `Hi,\n\n{{inviter_name}} has invited you to join their team on WeDoneDoIt as a {{role}}.\n\nAccept the invitation: {{register_url}}\n\n— WeDoneDoIt`,
    },

    // ── Marketing / Outreach ──
    {
      name: 'cold_outreach',
      category: 'marketing',
      description: 'First contact to a potential lead — subdivision-based',
      subject_template: '{{home_count}} homes in {{subdivision_name}} may need {{service_type}} service',
      body_html_template: `<p>Hi {{name}},</p>
<p>I'm {{contractor_name}} with <strong>{{company_name}}</strong>, and I specialize in {{service_type}} work in the {{area}} area.</p>
<p>I came across <strong>{{subdivision_name}}</strong> — with homes built around <strong>{{year_built}}</strong>, many are reaching the point where {{service_type}} service becomes a smart investment rather than an emergency repair.</p>
<p>I'm offering free inspections and competitive quotes for homeowners in the area. If you or anyone you know could use a reliable contractor, I'd love to help.</p>
<p>Feel free to reply to this email or give me a call at <strong>{{phone}}</strong>.</p>
<p>Best,<br/>{{contractor_name}}<br/>{{company_name}}<br/>{{phone}}</p>`,
      body_text_template: `Hi {{name}},\n\nI'm {{contractor_name}} with {{company_name}}, specializing in {{service_type}} in {{area}}.\n\n{{subdivision_name}} has homes built around {{year_built}} — many may benefit from {{service_type}} service soon.\n\nI'm offering free inspections and competitive quotes. Reply or call {{phone}}.\n\nBest,\n{{contractor_name}}\n{{company_name}}`,
    },
    {
      name: 'quote_follow_up',
      category: 'marketing',
      description: 'Follow-up after sending a quote or estimate',
      subject_template: 'Following up on your {{service_type}} quote',
      body_html_template: `<p>Hi {{name}},</p>
<p>I wanted to follow up on the {{service_type}} quote I sent over. I know choosing a contractor is a big decision, so I'm happy to answer any questions or adjust the scope.</p>
<p>A few things that set us apart:</p>
<ul>
<li>Licensed, insured, and locally based</li>
<li>Transparent pricing — no surprise add-ons</li>
<li>We stand behind our work with a satisfaction guarantee</li>
</ul>
<p>Would you like to schedule a time to talk through the details?</p>
<p>Best,<br/>{{contractor_name}}<br/>{{company_name}}<br/>{{phone}}</p>`,
      body_text_template: `Hi {{name}},\n\nFollowing up on the {{service_type}} quote I sent. Happy to answer questions or adjust the scope.\n\nWe're licensed, insured, locally based, with transparent pricing and a satisfaction guarantee.\n\nWant to schedule a call?\n\n{{contractor_name}}\n{{company_name}}\n{{phone}}`,
    },
    {
      name: 'project_thank_you',
      category: 'marketing',
      description: 'Thank you after completing a project — asks for review/referral',
      subject_template: 'Thank you for choosing {{company_name}}!',
      body_html_template: `<p>Hi {{name}},</p>
<p>Thank you for trusting <strong>{{company_name}}</strong> with your {{service_type}} project. We hope you're happy with the results!</p>
<p>If you have a moment, we'd really appreciate it if you could:</p>
<ul>
<li><strong>Leave us a review</strong> — It helps other homeowners find quality contractors</li>
<li><strong>Refer a neighbor</strong> — If anyone you know needs similar work, we'd love to help them too</li>
</ul>
<p>We're always here if you need anything in the future. Thanks again!</p>
<p>Best,<br/>{{contractor_name}}<br/>{{company_name}}<br/>{{phone}}</p>`,
      body_text_template: `Hi {{name}},\n\nThank you for trusting {{company_name}} with your {{service_type}} project!\n\nIf you have a moment, we'd appreciate a review or referral to neighbors who need similar work.\n\nWe're always here if you need anything.\n\n{{contractor_name}}\n{{company_name}}\n{{phone}}`,
    },
    {
      name: 'seasonal_reminder',
      category: 'marketing',
      description: 'Seasonal maintenance reminder to past clients',
      subject_template: '{{season}} is here — time for {{service_type}} maintenance',
      body_html_template: `<p>Hi {{name}},</p>
<p>{{season}} is here, and it's the perfect time to get ahead on {{service_type}} maintenance before the rush.</p>
<p>As a past client, we wanted to give you first access to our seasonal scheduling. Booking early means:</p>
<ul>
<li>Priority scheduling — beat the wait times</li>
<li>Better pricing — before peak-season rates kick in</li>
<li>Peace of mind — one less thing on your list</li>
</ul>
<p>Want to get on the schedule? Reply to this email or call us at <strong>{{phone}}</strong>.</p>
<p>Best,<br/>{{contractor_name}}<br/>{{company_name}}<br/>{{phone}}</p>`,
      body_text_template: `Hi {{name}},\n\n{{season}} is here — time for {{service_type}} maintenance.\n\nAs a past client, you get priority scheduling, better pricing, and peace of mind.\n\nReply or call {{phone}} to get on the schedule.\n\n{{contractor_name}}\n{{company_name}}`,
    },
    {
      name: 'referral_request',
      category: 'marketing',
      description: 'Ask satisfied client for referrals',
      subject_template: 'Know someone who needs a great {{service_type}} contractor?',
      body_html_template: `<p>Hi {{name}},</p>
<p>Thanks again for being a valued client of <strong>{{company_name}}</strong>. We loved working on your project!</p>
<p>The best compliment we can receive is a referral. If you know any friends, family, or neighbors who need {{service_type}} work, we'd be grateful if you'd pass along our info:</p>
<p style="background:#f8f9fa;padding:16px;border-radius:6px;text-align:center">
<strong>{{contractor_name}}</strong><br/>
{{company_name}}<br/>
{{phone}}<br/>
{{email}}
</p>
<p>Thank you for helping us grow through word of mouth — it means the world.</p>
<p>Best,<br/>{{contractor_name}}</p>`,
      body_text_template: `Hi {{name}},\n\nThanks for being a valued client! If you know anyone who needs {{service_type}} work, we'd appreciate a referral:\n\n{{contractor_name}}\n{{company_name}}\n{{phone}}\n{{email}}\n\nThank you!\n{{contractor_name}}`,
    },
  ]);
}
