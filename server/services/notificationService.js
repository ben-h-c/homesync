const db = require('../db');
const { sendTemplatedEmail, sendEmail } = require('./emailService');

/**
 * Create an in-app notification and optionally send an email alert.
 *
 * @param {Object} opts
 * @param {number} opts.userId - Recipient user ID
 * @param {string} opts.type - Notification type (client_message, invoice_paid, etc.)
 * @param {string} opts.title - Short notification title
 * @param {string} opts.message - Notification body text
 * @param {string} [opts.link] - In-app route to navigate to
 * @param {number} [opts.relatedJobId] - Related job ID
 * @param {number} [opts.relatedInvoiceId] - Related invoice ID
 */
async function createNotification({ userId, type, title, message, link, relatedJobId, relatedInvoiceId }) {
  const [id] = await db('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    link: link || null,
    related_job_id: relatedJobId || null,
    related_invoice_id: relatedInvoiceId || null,
  });

  // Check if user wants email notifications for this type
  try {
    const user = await db('users').where('id', userId).first();
    if (!user) return id;

    const prefMap = {
      client_message: 'notification_client_messages',
      invoice_paid: 'notification_invoice_payments',
      invoice_viewed: 'notification_invoice_payments',
      change_order_response: 'notification_project_updates',
      portal_accessed: 'notification_project_updates',
      new_lead: 'notification_new_leads',
    };

    const prefKey = prefMap[type];
    if (prefKey && user[prefKey] === 'true') {
      await sendEmail({
        to_email: user.email,
        to_name: user.first_name,
        subject: title,
        body_html: `<p>Hi ${user.first_name || 'there'},</p>
<p>${message}</p>
${link ? `<p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/#${link}" class="btn">View in ContractorHub</a></p>` : ''}
<p style="font-size:13px;color:#666">You can manage your notification preferences in Settings.</p>`,
        preheader: message,
      });
    }
  } catch {} // email is best-effort

  return id;
}

// ── Event-specific helpers ──

async function notifyClientMessage({ contractorUserId, jobId, clientName, messagePreview }) {
  const job = await db('contractor_jobs').where('id', jobId).first();
  const projectTitle = job?.title || 'a project';
  return createNotification({
    userId: contractorUserId,
    type: 'client_message',
    title: `New message from ${clientName}`,
    message: `${clientName} sent a message on "${projectTitle}": "${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}"`,
    link: `/messages?job=${jobId}`,
    relatedJobId: jobId,
  });
}

async function notifyInvoicePaid({ contractorUserId, invoiceId, invoiceNumber, customerName, total }) {
  return createNotification({
    userId: contractorUserId,
    type: 'invoice_paid',
    title: `Invoice ${invoiceNumber} paid!`,
    message: `${customerName} paid $${total} on invoice ${invoiceNumber}.`,
    link: `/invoices/${invoiceId}`,
    relatedInvoiceId: invoiceId,
  });
}

async function notifyInvoiceViewed({ contractorUserId, invoiceId, invoiceNumber, customerName }) {
  return createNotification({
    userId: contractorUserId,
    type: 'invoice_viewed',
    title: `Invoice ${invoiceNumber} viewed`,
    message: `${customerName} viewed invoice ${invoiceNumber}.`,
    link: `/invoices/${invoiceId}`,
    relatedInvoiceId: invoiceId,
  });
}

async function notifyChangeOrderResponse({ contractorUserId, jobId, clientName, action, coNumber }) {
  const job = await db('contractor_jobs').where('id', jobId).first();
  return createNotification({
    userId: contractorUserId,
    type: 'change_order_response',
    title: `Change order ${coNumber} ${action}`,
    message: `${clientName} ${action} change order ${coNumber} on "${job?.title || 'a project'}".`,
    link: `/jobs/${jobId}`,
    relatedJobId: jobId,
  });
}

async function notifyPortalAccessed({ contractorUserId, jobId, clientName }) {
  const job = await db('contractor_jobs').where('id', jobId).first();
  return createNotification({
    userId: contractorUserId,
    type: 'portal_accessed',
    title: `${clientName} viewed their portal`,
    message: `${clientName} accessed the client portal for "${job?.title || 'a project'}".`,
    link: `/jobs/${jobId}`,
    relatedJobId: jobId,
  });
}

module.exports = {
  createNotification,
  notifyClientMessage,
  notifyInvoicePaid,
  notifyInvoiceViewed,
  notifyChangeOrderResponse,
  notifyPortalAccessed,
};
