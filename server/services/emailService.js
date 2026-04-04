const db = require('../db');

let resend = null;
try {
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_xxxxxxxxxxxx') {
    const { Resend } = require('resend');
    resend = new Resend(process.env.RESEND_API_KEY);
  }
} catch {}

// ── Professional HTML email wrapper ──
function wrapHtml(bodyContent, { preheader, footerText } = {}) {
  const brandColor = '#0E7C7B';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title></title>
${preheader ? `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheader}</span>` : ''}
<style>
  body { margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  .email-wrapper { width: 100%; background: #f4f4f7; padding: 24px 0; }
  .email-body { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .email-header { background: ${brandColor}; padding: 24px 32px; text-align: center; }
  .email-header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: -0.3px; }
  .email-content { padding: 32px; color: #333333; font-size: 15px; line-height: 1.6; }
  .email-content p { margin: 0 0 16px; }
  .email-content a { color: ${brandColor}; }
  .email-content ul { padding-left: 20px; margin: 0 0 16px; }
  .email-content li { margin-bottom: 6px; }
  .btn { display: inline-block; padding: 12px 28px; background: ${brandColor}; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; }
  .email-footer { padding: 20px 32px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eee; }
  .email-footer a { color: #999999; }
  @media (max-width: 640px) {
    .email-content { padding: 24px 20px; }
    .email-header { padding: 20px; }
  }
</style>
</head>
<body>
<div class="email-wrapper">
  <div class="email-body">
    <div class="email-header">
      <h1>HomeSync</h1>
    </div>
    <div class="email-content">
      ${bodyContent}
    </div>
    <div class="email-footer">
      ${footerText || 'Sent via HomeSync &mdash; Smart tools for contractors who mean business.'}
    </div>
  </div>
</div>
</body>
</html>`;
}

// ── Strip HTML to plain text ──
function htmlToText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '  - ')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Core send function ──
// Accepts { to_email, subject, body_html } (canonical)
// Also accepts { to, subject, html } for backwards compatibility
async function sendEmail({
  to_email, to,
  to_name,
  subject,
  body_html, html,
  body_text,
  contact_id,
  template_used,
  related_project_id,
  related_subdivision_id,
  wrap = true,
  preheader,
  footerText,
}) {
  // Normalize params
  const recipient = to_email || to;
  let htmlContent = body_html || html || '';
  const textContent = body_text || htmlToText(htmlContent);

  if (!recipient) throw new Error('Recipient email is required');
  if (!subject) throw new Error('Subject is required');

  // Wrap in professional layout unless explicitly disabled
  if (wrap && htmlContent) {
    htmlContent = wrapHtml(htmlContent, { preheader, footerText });
  }

  const fromEmail = process.env.FROM_EMAIL || 'hello@wedonedoit.com';
  const fromName = process.env.FROM_NAME || 'HomeSync';

  let status = 'draft';
  let resendId = null;

  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [recipient],
        subject,
        html: htmlContent,
        text: textContent,
      });
      if (error) {
        console.error('Resend error:', error);
        status = 'failed';
      } else {
        status = 'sent';
        resendId = data?.id || null;
      }
    } catch (err) {
      console.error('Resend send failed:', err.message);
      status = 'failed';
    }
  } else {
    // No Resend configured — mock mode (save as sent for dev)
    status = 'sent';
    console.log(`[Email Mock] To: ${recipient} | Subject: ${subject}`);
  }

  // Save to database
  const [id] = await db('emails').insert({
    contact_id: contact_id || null,
    to_email: recipient,
    to_name: to_name || null,
    from_email: fromEmail,
    subject,
    body_html: htmlContent,
    body_text: textContent,
    template_used: template_used || null,
    status,
    resend_id: resendId,
    related_project_id: related_project_id || null,
    related_subdivision_id: related_subdivision_id || null,
  });

  // Auto-log activity for contacts
  if (contact_id) {
    try {
      await db('activities').insert({
        contact_id,
        subdivision_id: related_subdivision_id || null,
        project_id: related_project_id || null,
        type: 'email_sent',
        subject: `Email: ${subject}`,
        description: `Sent to ${to_name || recipient}`,
      });
      await db('contacts').where('id', contact_id).update({
        last_contacted: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch {} // activity logging is best-effort
  }

  return await db('emails').where('id', id).first();
}

// ── Send a templated email ──
// Loads template by name, renders variables, sends
async function sendTemplatedEmail(templateName, variables, sendOpts = {}) {
  const template = await db('email_templates').where('name', templateName).first();
  if (!template) throw new Error(`Email template "${templateName}" not found`);

  const rendered = renderTemplate(template, variables);
  return sendEmail({
    ...sendOpts,
    subject: rendered.subject,
    body_html: rendered.body_html,
    body_text: rendered.body_text,
    template_used: templateName,
  });
}

// ── Template variable substitution ──
function renderTemplate(template, variables) {
  let subject = template.subject_template;
  let html = template.body_html_template;
  let text = template.body_text_template || '';

  for (const [key, value] of Object.entries(variables || {})) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    const val = String(value ?? '');
    subject = subject.replace(pattern, val);
    html = html.replace(pattern, val);
    text = text.replace(pattern, val);
  }

  return { subject, body_html: html, body_text: text };
}

module.exports = { sendEmail, sendTemplatedEmail, renderTemplate, wrapHtml, htmlToText };
