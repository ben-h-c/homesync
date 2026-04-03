const db = require('../db');

let resend = null;
try {
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_xxxxxxxxxxxx') {
    const { Resend } = require('resend');
    resend = new Resend(process.env.RESEND_API_KEY);
  }
} catch {}

async function sendEmail({ to_email, to_name, subject, body_html, body_text, contact_id, template_used, related_project_id, related_subdivision_id }) {
  const fromEmail = process.env.FROM_EMAIL || 'hello@homesync.com';
  const fromName = process.env.FROM_NAME || 'HomeSync';

  let status = 'draft';
  let resendId = null;

  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [to_email],
        subject,
        html: body_html,
        text: body_text || undefined,
      });
      if (error) {
        status = 'failed';
      } else {
        status = 'sent';
        resendId = data?.id || null;
      }
    } catch {
      status = 'failed';
    }
  } else {
    // No Resend configured — save as sent (mock mode)
    status = 'sent';
  }

  // Save to database
  const [id] = await db('emails').insert({
    contact_id: contact_id || null,
    to_email,
    to_name: to_name || null,
    from_email: fromEmail,
    subject,
    body_html,
    body_text: body_text || null,
    template_used: template_used || null,
    status,
    resend_id: resendId,
    related_project_id: related_project_id || null,
    related_subdivision_id: related_subdivision_id || null,
  });

  // Auto-log activity
  if (contact_id) {
    await db('activities').insert({
      contact_id,
      subdivision_id: related_subdivision_id || null,
      project_id: related_project_id || null,
      type: 'email_sent',
      subject: `Email: ${subject}`,
      description: `Sent to ${to_name || to_email}`,
    });
    await db('contacts').where('id', contact_id).update({
      last_contacted: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return await db('emails').where('id', id).first();
}

function renderTemplate(template, variables) {
  let subject = template.subject_template;
  let html = template.body_html_template;
  let text = template.body_text_template || '';

  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    subject = subject.replace(pattern, String(value));
    html = html.replace(pattern, String(value));
    text = text.replace(pattern, String(value));
  }

  return { subject, body_html: html, body_text: text };
}

module.exports = { sendEmail, renderTemplate };
