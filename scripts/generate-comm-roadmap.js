#!/usr/bin/env node
/**
 * Generate the ContractorHub Communication System Roadmap PDF
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 60, bottom: 60, left: 60, right: 60 },
  info: {
    Title: 'ContractorHub Communication System Roadmap',
    Author: 'ContractorHub',
    Subject: 'Step-by-step guide to building a complete contractor-client communication platform',
  },
});

const outputPath = path.resolve(__dirname, '..', 'ContractorHub_Communication_Roadmap.pdf');
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const BRAND = '#0E7C7B';
const NAVY = '#0F3460';
const GRAY = '#555555';
const LIGHT_GRAY = '#999999';

function heading(text, size = 22) {
  doc.moveDown(0.5);
  doc.fontSize(size).fillColor(NAVY).text(text);
  doc.moveDown(0.3);
  doc.moveTo(doc.x, doc.y).lineTo(doc.x + 490, doc.y).strokeColor(BRAND).lineWidth(2).stroke();
  doc.moveDown(0.5);
}

function subheading(text) {
  doc.moveDown(0.3);
  doc.fontSize(14).fillColor(BRAND).text(text);
  doc.moveDown(0.2);
}

function body(text) {
  doc.fontSize(10.5).fillColor(GRAY).text(text, { lineGap: 3 });
}

function bullet(text) {
  doc.fontSize(10.5).fillColor(GRAY).text(`  \u2022  ${text}`, { lineGap: 2, indent: 10 });
}

function numberedStep(num, title, description) {
  doc.moveDown(0.2);
  doc.fontSize(11).fillColor(NAVY).text(`Step ${num}: ${title}`, { continued: false });
  doc.fontSize(10).fillColor(GRAY).text(description, { lineGap: 2, indent: 15 });
  doc.moveDown(0.1);
}

function codeBlock(text) {
  doc.moveDown(0.2);
  doc.rect(doc.x, doc.y, 490, 12 + text.split('\n').length * 13).fill('#f5f5f5').stroke('#ddd');
  doc.moveDown(0.15);
  doc.fontSize(9).fillColor('#333').font('Courier').text(text, doc.x + 8, doc.y, { lineGap: 2 });
  doc.font('Helvetica');
  doc.moveDown(0.3);
}

function costBox(service, free, paid) {
  doc.moveDown(0.1);
  doc.fontSize(10).fillColor(NAVY).text(`${service}`, { continued: true });
  doc.fillColor(BRAND).text(`  Free: ${free}  |  Paid: ${paid}`);
}

function pageCheck() {
  if (doc.y > 650) doc.addPage();
}

// ═══════════════════════════════════════════════════════
// COVER PAGE
// ═══════════════════════════════════════════════════════
doc.moveDown(6);
doc.fontSize(32).fillColor(NAVY).text('ContractorHub', { align: 'center' });
doc.fontSize(14).fillColor(BRAND).text('Communication System Roadmap', { align: 'center' });
doc.moveDown(2);
doc.fontSize(11).fillColor(GRAY).text('A step-by-step guide to building a complete contractor-client\ncommunication platform with SMS, real-time messaging,\npush notifications, and more.', { align: 'center', lineGap: 3 });
doc.moveDown(3);
doc.fontSize(10).fillColor(LIGHT_GRAY).text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
doc.moveDown(1);
doc.fontSize(10).fillColor(LIGHT_GRAY).text('This document covers what has been built and provides\ndetailed implementation guides for remaining phases.', { align: 'center', lineGap: 2 });

// ═══════════════════════════════════════════════════════
// TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════
doc.addPage();
heading('Table of Contents', 20);
const toc = [
  ['1.', 'What Has Been Built (Completed)'],
  ['2.', 'Phase 1: SMS & Text Messaging (Twilio)'],
  ['3.', 'Phase 2: Real-Time WebSocket Upgrade'],
  ['4.', 'Phase 3: Push Notifications'],
  ['5.', 'Phase 4: File & Photo Attachments'],
  ['6.', 'Phase 5: Automated Appointment Reminders'],
  ['7.', 'Phase 6: Communication Analytics Dashboard'],
  ['8.', 'Implementation Timeline & Cost Summary'],
  ['9.', 'Recommended Implementation Order'],
];
for (const [num, title] of toc) {
  doc.fontSize(11).fillColor(NAVY).text(`${num}  ${title}`, { lineGap: 6 });
}

// ═══════════════════════════════════════════════════════
// SECTION 1: WHAT'S BUILT
// ═══════════════════════════════════════════════════════
doc.addPage();
heading('1. What Has Been Built (Completed)');
body('The following communication features are live and functional in the codebase:');
doc.moveDown(0.3);

subheading('Email System (Resend API)');
bullet('Professional branded HTML email wrapper for all outgoing email');
bullet('11 email templates: welcome, password reset, invoice sent/overdue, portal invite, team invite, 5 marketing templates');
bullet('Campaign system: compose, recipient management, batch send with personalization');
bullet('Automatic email on: registration, invoice send, portal enable, team invite, password reset');
bullet('Mock mode for development (no API key needed)');
doc.moveDown(0.3);

subheading('In-App Messaging (Client Portal)');
bullet('Bidirectional messaging between contractor and client per project');
bullet('Client portal: token-based auth (no login required), 90-day expiry');
bullet('Contractor Messages inbox: unified view of all client conversations');
bullet('Unread message badges in sidebar navigation');
bullet('10-second polling for new messages in active conversations');
doc.moveDown(0.3);

subheading('Notification System');
bullet('Notifications table with type, title, message, link, read status');
bullet('Notification bell in header with unread count badge');
bullet('Dropdown showing recent notifications with click-to-navigate');
bullet('Mark individual or all notifications as read');
bullet('Auto-notifications on: client message, invoice paid/viewed, change order response, portal accessed');
bullet('Email alerts triggered by user notification preferences');
doc.moveDown(0.3);

subheading('Notification Preferences');
bullet('Per-user toggles: new leads, invoice payments, client messages, project updates');
bullet('Stored in user profile, editable in Settings > Notifications tab');
bullet('Wired to email sending: when preference is enabled, email alert is sent alongside in-app notification');

// ═══════════════════════════════════════════════════════
// SECTION 2: SMS / TWILIO
// ═══════════════════════════════════════════════════════
doc.addPage();
heading('2. Phase 1: SMS & Text Messaging (Twilio)');
body('SMS is the #1 communication channel for contractors. Clients expect text confirmations, appointment reminders, and quick updates. This is the highest-impact feature to add next.');
doc.moveDown(0.3);

subheading('Why Twilio');
bullet('Industry standard for programmable SMS');
bullet('Free trial with $15 credit (enough for ~1,500 texts)');
bullet('$0.0079/message after trial (a $1,000 invoice reminder costs less than 1 cent)');
bullet('Phone number: $1.15/month for a local number');
bullet('Node.js SDK: npm install twilio');
doc.moveDown(0.3);

subheading('Step-by-Step Implementation');
numberedStep(1, 'Create Twilio account', 'Sign up at twilio.com. Verify your phone number. Note your Account SID and Auth Token from the dashboard.');
numberedStep(2, 'Buy a phone number', 'In the Twilio console, go to Phone Numbers > Buy a Number. Choose a local number with SMS capability in your area code.');
numberedStep(3, 'Install the SDK', 'Run: npm install twilio in the server/ directory.');
numberedStep(4, 'Add environment variables', 'Add to .env:\n  TWILIO_ACCOUNT_SID=ACxxxxxxxxx\n  TWILIO_AUTH_TOKEN=your_auth_token\n  TWILIO_PHONE_NUMBER=+1xxxxxxxxxx');

pageCheck();
numberedStep(5, 'Create smsService.js', 'Create server/services/smsService.js with a sendSMS function:');
codeBlock(`const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendSMS({ to, message }) {
  return client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: to, // E.164 format: +1XXXXXXXXXX
  });
}`);

numberedStep(6, 'Add SMS triggers', 'Wire SMS into existing flows:\n  - Invoice sent: "Invoice #INV-2026-001 for $1,500 from [Company]. View: [portal_url]"\n  - Appointment reminder: "Reminder: [service] scheduled for tomorrow at [time]. Reply C to confirm."\n  - Project status change: "[Company]: Your [service] project status updated to [status]."\n  - New message notification: "New message from [company] about your [project]. View: [portal_url]"');

numberedStep(7, 'Add opt-in/opt-out', 'IMPORTANT: SMS requires consent. Add:\n  - Checkbox on client portal: "Send me text updates"\n  - Add phone field to client_portal_tokens table\n  - Handle STOP replies (Twilio auto-manages opt-out, but log it)\n  - Store sms_opt_in boolean on portal token or client record');

numberedStep(8, 'Add phone number to invoice/portal forms', 'Update InvoiceForm and ProjectForm to capture client phone number alongside email.');

doc.moveDown(0.3);
subheading('Cost Estimate');
costBox('Twilio SMS', '$15 trial credit (~1,500 msgs)', '$0.0079/msg + $1.15/mo per number');
body('A contractor sending 200 texts/month pays ~$2.73/month total.');

// ═══════════════════════════════════════════════════════
// SECTION 3: WEBSOCKETS
// ═══════════════════════════════════════════════════════
doc.addPage();
heading('3. Phase 2: Real-Time WebSocket Upgrade');
body('Currently, messages use 10-15 second HTTP polling. WebSockets provide instant delivery and reduce server load by 90%+ for active conversations.');
doc.moveDown(0.3);

subheading('Technology Choice: Socket.IO');
bullet('Built on WebSockets with automatic fallback to long-polling');
bullet('Room-based architecture maps perfectly to job-based conversations');
bullet('npm install socket.io (server) + socket.io-client (frontend)');
bullet('Works with Express.js — attaches to existing HTTP server');
doc.moveDown(0.3);

subheading('Step-by-Step Implementation');
numberedStep(1, 'Install dependencies', 'Server: npm install socket.io\nClient: npm install socket.io-client');
numberedStep(2, 'Create WebSocket server', 'In server/index.js, wrap the Express app with an HTTP server and attach Socket.IO:');
codeBlock(`const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' }
});
server.listen(PORT); // instead of app.listen(PORT)`);

numberedStep(3, 'Add authentication middleware', 'Verify JWT token on WebSocket connection:');
codeBlock(`io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = verifyAccessToken(token);
    socket.userId = decoded.id;
    next();
  } catch { next(new Error('Unauthorized')); }
});`);

pageCheck();
numberedStep(4, 'Implement room-based messaging', 'When a contractor views a conversation, join the room for that job. When a portal client loads messages, join the same room:');
codeBlock(`io.on('connection', (socket) => {
  socket.on('join-conversation', (jobId) => {
    socket.join('job-' + jobId);
  });
});

// In message POST routes, emit to the room:
io.to('job-' + jobId).emit('new-message', savedMessage);`);

numberedStep(5, 'Update frontend components', 'Replace setInterval polling with socket listeners in Messages.jsx and PortalMessages.jsx:\n  - Connect on mount, disconnect on unmount\n  - Listen for "new-message" events and append to local state\n  - Emit "join-conversation" when selecting a thread');

numberedStep(6, 'Add typing indicators (optional)', 'Emit "typing" events when user is composing. Show "Client is typing..." indicator in the chat UI.');

numberedStep(7, 'Handle Render.com deployment', 'Render.com supports WebSockets natively on its web services. No special configuration needed. Ensure your health check endpoint still uses HTTP.');

doc.moveDown(0.3);
subheading('Cost Estimate');
body('Socket.IO adds no direct cost — it runs on your existing server. Memory usage increases slightly (~2KB per active connection). For 100 concurrent users, this is negligible.');

// ═══════════════════════════════════════════════════════
// SECTION 4: PUSH NOTIFICATIONS
// ═══════════════════════════════════════════════════════
doc.addPage();
heading('4. Phase 3: Push Notifications');
body('Push notifications alert contractors on their phone/desktop even when they are not actively using the app. Critical for time-sensitive messages from clients.');
doc.moveDown(0.3);

subheading('Technology: Web Push API + Firebase Cloud Messaging (FCM)');
bullet('Web Push works in Chrome, Firefox, Edge, Safari (since iOS 16.4)');
bullet('Firebase Cloud Messaging is free for unlimited push notifications');
bullet('Requires a Service Worker (also enables PWA/offline support)');
bullet('npm install web-push (server) + Firebase JS SDK or direct Push API (client)');
doc.moveDown(0.3);

subheading('Step-by-Step Implementation');
numberedStep(1, 'Create Firebase project', 'Go to console.firebase.google.com. Create a new project "ContractorHub". Go to Project Settings > Cloud Messaging. Note the Server Key and Sender ID.');

numberedStep(2, 'Generate VAPID keys', 'Run: npx web-push generate-vapid-keys\nSave the public and private keys to .env:\n  VAPID_PUBLIC_KEY=BPxxxxxx\n  VAPID_PRIVATE_KEY=xxxxxx\n  VAPID_EMAIL=mailto:admin@contractorhub.com');

numberedStep(3, 'Create Service Worker', 'Create client/public/sw.js:');
codeBlock(`self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { url: data.link },
  });
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});`);

pageCheck();
numberedStep(4, 'Register Service Worker on frontend', 'In client/src/main.jsx or App.jsx, register the service worker and request permission:');
codeBlock(`if ('serviceWorker' in navigator) {
  const reg = await navigator.serviceWorker.register('/sw.js');
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });
  // Send subscription to backend: POST /api/push/subscribe
}`);

numberedStep(5, 'Create push subscription API', 'Migration: add push_subscriptions table (user_id, endpoint, p256dh, auth, created_at).\nRoute: POST /api/push/subscribe to save subscription.\nRoute: DELETE /api/push/unsubscribe to remove.');

numberedStep(6, 'Send push from notification service', 'In notificationService.js, after creating a notification, check for push subscriptions and send:');
codeBlock(`const webpush = require('web-push');
webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

const subs = await db('push_subscriptions').where('user_id', userId);
for (const sub of subs) {
  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify({ title, message, link })
  ).catch(() => db('push_subscriptions').where('id', sub.id).del());
}`);

numberedStep(7, 'Add permission prompt UI', 'Show a tasteful banner: "Enable notifications to get alerted when clients message you." Only show after the user has been active for a few sessions (not on first visit). Respect the dismiss.');

doc.moveDown(0.3);
subheading('Cost Estimate');
costBox('Firebase Cloud Messaging', 'Free (unlimited)', 'Free (unlimited)');
costBox('web-push npm package', 'Free / open source', 'N/A');
body('Push notifications are completely free at any scale.');

// ═══════════════════════════════════════════════════════
// SECTION 5: FILE ATTACHMENTS
// ═══════════════════════════════════════════════════════
doc.addPage();
heading('5. Phase 4: File & Photo Attachments');
body('Contractors need to share photos of work progress. Clients need to send reference photos or documents. The message system needs file attachment support.');
doc.moveDown(0.3);

subheading('Technology: AWS S3 (or Cloudflare R2)');
bullet('S3: Industry standard for file storage. $0.023/GB/month.');
bullet('R2: S3-compatible, zero egress fees. $0.015/GB/month. Good for image-heavy apps.');
bullet('Presigned URLs: Client uploads directly to S3, bypassing your server.');
bullet('npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner');
doc.moveDown(0.3);

subheading('Step-by-Step Implementation');
numberedStep(1, 'Create S3 bucket', 'AWS Console > S3 > Create Bucket "contractorhub-files". Enable versioning. Set CORS to allow uploads from your domain. Block public access (use presigned URLs).');

numberedStep(2, 'Create IAM credentials', 'Create an IAM user with S3 put/get permissions. Save access key and secret to .env:\n  AWS_ACCESS_KEY_ID=AKIAxxxxxx\n  AWS_SECRET_ACCESS_KEY=xxxxxx\n  AWS_S3_BUCKET=contractorhub-files\n  AWS_REGION=us-east-1');

numberedStep(3, 'Create upload endpoint', 'POST /api/uploads/presigned-url generates a presigned PUT URL:');
codeBlock(`const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

router.post('/presigned-url', async (req, res) => {
  const key = 'uploads/' + req.user.id + '/' + Date.now() + '-' + req.body.filename;
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: req.body.content_type });
  const url = await getSignedUrl(s3, command, { expiresIn: 300 });
  res.json({ upload_url: url, file_key: key });
});`);

pageCheck();
numberedStep(4, 'Add attachments to messages table', 'Migration: add attachments column (JSON) to client_messages table. Store array of { key, filename, content_type, size }.');

numberedStep(5, 'Build upload UI component', 'Create a reusable FileUpload component:\n  - Drag-and-drop zone + click to browse\n  - Image preview for photos\n  - Progress bar during upload\n  - Max file size: 10MB. Accepted: jpg, png, pdf, doc.\n  - Upload to presigned URL, then save key in message.');

numberedStep(6, 'Add image gallery to messages', 'Render image attachments inline in the message bubble. PDFs/docs show as download links. Use presigned GET URLs for viewing (expires in 1 hour).');

numberedStep(7, 'Add photo gallery to project detail', 'The contractor_jobs.photos JSON field already exists but has no upload UI. Wire it to the same S3 upload flow. Show a grid of project photos on JobDetail page.');

doc.moveDown(0.3);
subheading('Cost Estimate');
costBox('AWS S3', '5GB free (12 months)', '$0.023/GB/month + $0.005/1K requests');
costBox('Cloudflare R2', '10GB free (forever)', '$0.015/GB/month, zero egress');
body('For 500 photos (avg 2MB each) = 1GB = $0.02/month on S3 or free on R2.');

// ═══════════════════════════════════════════════════════
// SECTION 6: APPOINTMENT REMINDERS
// ═══════════════════════════════════════════════════════
doc.addPage();
heading('6. Phase 5: Automated Appointment Reminders');
body('Missed appointments cost contractors time and money. Automated reminders via SMS + email reduce no-shows by 30-50%. This requires a scheduling system and a cron job.');
doc.moveDown(0.3);

subheading('Architecture');
bullet('Add scheduled_date and scheduled_time fields to contractor_jobs');
bullet('Cron job runs every 15 minutes checking for upcoming appointments');
bullet('Send reminders at: 24 hours before, 2 hours before, and day-of morning');
bullet('Track which reminders have been sent to avoid duplicates');
doc.moveDown(0.3);

subheading('Step-by-Step Implementation');
numberedStep(1, 'Add scheduling fields', 'Migration: Add to contractor_jobs:\n  scheduled_date (date), scheduled_time (text), reminder_24h_sent (boolean), reminder_2h_sent (boolean), reminder_morning_sent (boolean)');

numberedStep(2, 'Update project form', 'Add date picker and time selector to ProjectForm.jsx. Show "Scheduled for [date] at [time]" on project cards and detail pages.');

numberedStep(3, 'Create reminder cron job', 'Use node-cron (npm install node-cron) to run every 15 minutes:');
codeBlock(`const cron = require('node-cron');

cron.schedule('*/15 * * * *', async () => {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24*60*60*1000);

  // Find jobs scheduled within next 24h, reminder not yet sent
  const jobs = await db('contractor_jobs')
    .where('scheduled_date', '<=', in24h.toISOString().split('T')[0])
    .where('scheduled_date', '>=', now.toISOString().split('T')[0])
    .where('reminder_24h_sent', false)
    .whereNotNull('client_email');

  for (const job of jobs) {
    await sendReminderEmail(job);
    await sendReminderSMS(job); // if Twilio configured
    await db('contractor_jobs').where('id', job.id)
      .update({ reminder_24h_sent: true });
  }
});`);

numberedStep(4, 'Create reminder templates', 'Add email templates: appointment_reminder_24h, appointment_reminder_2h.\nSMS templates: "[Company]: Reminder - Your [service] is scheduled for [date] at [time]. Reply C to confirm or R to reschedule."');

numberedStep(5, 'Add confirmation tracking', 'Track client confirmations:\n  - Email: track opens via Resend webhook\n  - SMS: parse "C" or "R" replies via Twilio webhook\n  - Portal: add a "Confirm Appointment" button');

numberedStep(6, 'Add to contractor dashboard', 'Show upcoming appointments on the dashboard with countdown timers and confirmation status.');

doc.moveDown(0.3);
subheading('Cost Estimate');
body('node-cron is free. The cost is in SMS sends (see Phase 1) and email sends (free under Resend free tier). For 50 appointments/month with 3 reminders each = 150 SMS = ~$1.19/month.');

// ═══════════════════════════════════════════════════════
// SECTION 7: ANALYTICS
// ═══════════════════════════════════════════════════════
doc.addPage();
heading('7. Phase 6: Communication Analytics Dashboard');
body('Help contractors understand their communication patterns and response times. This builds on data already being collected in the emails and client_messages tables.');
doc.moveDown(0.3);

subheading('Metrics to Track');
bullet('Average response time to client messages');
bullet('Message volume by day/week/month');
bullet('Email open rates and click-through rates (via Resend webhooks)');
bullet('Portal engagement: how often clients visit, pages viewed');
bullet('Invoice view-to-pay conversion time');
bullet('SMS delivery rate and response rate');
doc.moveDown(0.3);

subheading('Step-by-Step Implementation');
numberedStep(1, 'Create analytics API endpoint', 'GET /api/analytics/communication returns aggregated stats from existing tables:\n  - Count messages per week from client_messages\n  - Calculate avg response time: time between client message and next contractor message\n  - Count emails sent/failed from emails table\n  - Count portal accesses from client_portal_tokens.last_accessed_at');

numberedStep(2, 'Add Resend webhooks', 'Resend can POST events (delivered, opened, clicked, bounced) to your server.\n  - Create POST /api/webhooks/resend\n  - Verify webhook signature\n  - Update emails table: set opened_at, clicked_at, bounced fields\n  - Use these for open/click rate calculations');

numberedStep(3, 'Build analytics page', 'New CommunicationAnalytics.jsx page with:\n  - Response time card (average, trend)\n  - Message volume chart (Recharts line chart by week)\n  - Email performance: sent, delivered, opened, clicked, bounced\n  - Top conversations by volume\n  - Portal engagement stats');

numberedStep(4, 'Add to contractor dashboard', 'Show key communication stats on the main dashboard:\n  - "Avg response time: 2.3 hours" with trend arrow\n  - "Messages this week: 23" with comparison to last week\n  - "Portal visits: 8 clients viewed their projects"');

doc.moveDown(0.3);
subheading('Cost Estimate');
body('No additional cost. All data is already collected. Resend webhooks are free on all plans.');

// ═══════════════════════════════════════════════════════
// SECTION 8: TIMELINE & COST SUMMARY
// ═══════════════════════════════════════════════════════
doc.addPage();
heading('8. Implementation Timeline & Cost Summary');

subheading('Estimated Timeline');
doc.moveDown(0.2);

const phases = [
  ['Phase 1: SMS/Twilio', '1-2 days', '$0.01-5/month', 'High'],
  ['Phase 2: WebSockets', '1-2 days', '$0 (uses existing server)', 'Medium'],
  ['Phase 3: Push Notifications', '1-2 days', '$0 (FCM is free)', 'Medium'],
  ['Phase 4: File Attachments', '2-3 days', '$0-2/month (S3/R2)', 'Medium'],
  ['Phase 5: Appt Reminders', '1-2 days', '$1-3/month (SMS)', 'High'],
  ['Phase 6: Analytics', '1-2 days', '$0', 'Low'],
];

// Table header
doc.fontSize(10).fillColor(NAVY);
doc.text('Phase', 60, doc.y, { width: 170, continued: false });
doc.moveUp();
doc.text('Timeline', 230, doc.y, { width: 80 });
doc.moveUp();
doc.text('Monthly Cost', 310, doc.y, { width: 120 });
doc.moveUp();
doc.text('Impact', 430, doc.y, { width: 80 });
doc.moveDown(0.2);
doc.moveTo(60, doc.y).lineTo(510, doc.y).strokeColor('#ddd').lineWidth(0.5).stroke();
doc.moveDown(0.3);

for (const [phase, timeline, cost, impact] of phases) {
  doc.fontSize(10).fillColor(GRAY);
  const y = doc.y;
  doc.text(phase, 60, y, { width: 170 });
  doc.text(timeline, 230, y, { width: 80 });
  doc.text(cost, 310, y, { width: 120 });
  doc.fillColor(impact === 'High' ? '#e53e3e' : impact === 'Medium' ? '#d69e2e' : '#48bb78');
  doc.text(impact, 430, y, { width: 80 });
  doc.moveDown(0.3);
}

doc.moveDown(0.5);
subheading('Total Estimated Cost');
body('Infrastructure: $1-10/month for SMS + file storage.\nDevelopment: 8-13 days of implementation work.\nAll other components (WebSockets, push notifications, analytics, cron jobs) are free.');

// ═══════════════════════════════════════════════════════
// SECTION 9: RECOMMENDED ORDER
// ═══════════════════════════════════════════════════════
doc.moveDown(1);
heading('9. Recommended Implementation Order');
body('Based on user impact and dependency chain:');
doc.moveDown(0.3);

const order = [
  ['1. SMS/Twilio (Phase 1)', 'Highest user impact. Contractors live on their phones. Text confirmations feel immediate and professional. Foundation for appointment reminders.'],
  ['2. Appointment Reminders (Phase 5)', 'Depends on SMS. Directly reduces no-shows and increases revenue. Builds on Phase 1 infrastructure.'],
  ['3. File Attachments (Phase 4)', 'Enables photo sharing in messages. Unlocks the project photos feature. Needed before the app feels "complete."'],
  ['4. WebSocket Upgrade (Phase 2)', 'Quality-of-life improvement. Makes messaging feel instant. Reduces server load from polling.'],
  ['5. Push Notifications (Phase 3)', 'Ensures contractors never miss a message even when not in the app. Also enables PWA installation.'],
  ['6. Analytics Dashboard (Phase 6)', 'Nice-to-have. Builds on all data from previous phases. Low urgency but high retention value for power users.'],
];

for (const [title, desc] of order) {
  pageCheck();
  doc.fontSize(11).fillColor(NAVY).text(title);
  doc.fontSize(10).fillColor(GRAY).text(desc, { indent: 15, lineGap: 2 });
  doc.moveDown(0.4);
}

// ═══════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════
doc.moveDown(2);
doc.moveTo(60, doc.y).lineTo(550, doc.y).strokeColor(BRAND).lineWidth(1).stroke();
doc.moveDown(0.5);
doc.fontSize(9).fillColor(LIGHT_GRAY).text('ContractorHub Communication Roadmap | Generated automatically | Confidential', { align: 'center' });

// Done
doc.end();
stream.on('finish', () => {
  console.log(`PDF generated: ${outputPath}`);
  console.log(`Size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
});
