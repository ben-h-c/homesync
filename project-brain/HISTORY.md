# Project History — Changelog & Evolution

This is the living history of ContractorHub. Every major change, decision, pivot, and milestone goes here in reverse chronological order (newest first). Claude Code reads this at the start of every session to understand how we got here.

## How to Write Entries

Each entry should include:
- Date
- What changed (be specific — files, features, data)
- Why (the reasoning or trigger for the change)
- Impact (what it affected downstream)
- Who requested it (user feedback, internal decision, research finding)

---

## Entries

### 2026-04-04 — Full Production Readiness (7 Phases)
- **Phase 1: Production Deployment** — Fixed render.yaml with all env vars (JWT_SECRET, CORS_ORIGIN, CLIENT_URL, Resend, Stripe, Anthropic). Fixed CORS to support comma-separated origins. Added API 404 guard. Updated .env.example.
- **Phase 2: Security Hardening** — Added helmet + express-rate-limit (20 reqs/15min on auth). Fixed req.body pass-through in campaigns.js (whitelisted fields). Added trial expiration enforcement in authenticate middleware (checks trial_ends_at, returns 403 when expired without subscription).
- **Phase 3: Stripe Billing** — New billing.js route with create-checkout-session, webhook handler, portal-session, billing status. Stripe webhook mounted before express.json() for raw body. JWT tier staleness fix: authenticate now reads tier from DB on every request. Settings > Subscription tab now has working upgrade buttons and "Manage Billing" portal link.
- **Phase 4: Map Geolocation** — Migration 025 (user_latitude, user_longitude). ZIP code field added to registration. Nominatim geocoding on register + profile update. Bounding-box distance filtering on subdivisions endpoint (Starter: 15mi, Pro: 50mi, Enterprise: unlimited). Map centers on user location with Leaflet Circle radius overlay.
- **Phase 5: AI Marketing** — Installed @anthropic-ai/sdk. Migration 026 (ai_credits_used, ai_credits_reset_at). aiService.js with generateEmailCopy and generateMarketingPlan using claude-haiku-4-5. AI credit middleware (Starter: 5/mo, Pro: 25/mo, Enterprise: unlimited). New ai.js routes. MarketingHub ComposeTab has "AI Email Assistant" panel with neighborhood/service/tone selector.
- **Phase 6: Client Login** — Migration 027 (client_accounts table, client_account_id FK on portal_tokens). Client auth routes in client-portal.js (register, login, my-projects). Client JWT with type:'client' claim. ClientLogin.jsx and ClientProjects.jsx pages. Clients can now log in with email/password to see all their projects.
- **Phase 7: Data Discovery** — Migration 028 (data_discovery_jobs table). dataDiscoveryService.js using Nominatim to discover subdivisions by ZIP code. Admin routes: trigger discovery, view results, import approved subdivisions. Async job execution.
- **New dependencies**: stripe, @anthropic-ai/sdk, helmet, express-rate-limit
- **Database**: 33 tables (30 app + 3 knex), 28 migrations
- **Impact**: Platform is now production-deployable with real payments, AI-powered marketing, geo-scoped maps, client login, and automated data expansion.

### 2026-04-03 — Communication System Build
- **Contractor Messages inbox**: New Messages.jsx page with unified conversation list across all projects, message thread view, real-time polling, mobile-responsive split layout
- **Notification system**: Migration 024 (notifications table), notificationService.js with event-specific helpers, 4 API routes, notification bell in Layout header with dropdown and badges
- **Auto-notifications wired to 5 events**: client message, invoice viewed, invoice paid, change order response, portal first access (24h debounce)
- **Email alerts**: Notification preferences (already in DB) now wired to actual email sending — when preference is enabled, email alert accompanies in-app notification
- **Sidebar unread badge**: Messages nav item shows red badge with unread count (polls every 30s)
- **New API endpoints**: GET /api/jobs/conversations/list, GET /api/jobs/messages/unread-count, GET /api/notifications, GET /api/notifications/unread-count, POST /api/notifications/:id/read, POST /api/notifications/read-all
- **Communication Roadmap PDF**: Generated 9-section professional PDF covering SMS/Twilio, WebSocket upgrade, push notifications, file attachments, appointment reminders, and analytics dashboard with step-by-step implementation guides, code examples, and cost estimates
- **Impact**: Contractors can now see and respond to all client messages from one inbox. Real-time notification system keeps them informed of all key events.

### 2026-04-03 — Email System Overhaul
- **Decision**: Kept Resend as email provider (best DX, 3K/mo free tier, already integrated). Evaluated SendGrid, Postmark, Amazon SES, Mailgun.
- **Fixed critical bug**: All email senders (invoices, portal, team invite, campaigns) used wrong parameter names (`to`/`html` instead of `to_email`/`body_html`). Every email path was silently broken.
- **Rewrote emailService.js**: Added professional HTML email wrapper with ContractorHub branding, `htmlToText()` auto-generation, `sendTemplatedEmail()` helper, backwards-compatible param handling.
- **Replaced all 7 HOA templates** with 11 contractor SaaS templates: welcome, password_reset, invoice_sent, invoice_overdue, portal_invite, team_invite, cold_outreach, quote_follow_up, project_thank_you, seasonal_reminder, referral_request.
- **Built password reset flow**: Migration 023 (password_reset_tokens table), POST /api/auth/forgot-password and /api/auth/reset-password routes, frontend ForgotPassword.jsx and ResetPassword.jsx pages.
- **Added welcome email** on registration.
- **Added "Forgot password?"** link on login page.
- **Updated demo data** in api/client.js for new template names.
- **Updated .env.example** with CLIENT_URL and cleaner defaults.
- **Impact**: All email paths now work correctly. Password reset closes a P1 backlog item. Templates match the contractor SaaS business model.

### 2026-04-03 — Deep Research Cycle (12 searches, 60+ sources)
- **Competitor analysis**: Detailed pricing for Jobber ($39-599), Housecall Pro ($59-custom), ServiceTitan ($250-500/tech), Buildertrend ($399-1099), FieldPulse
- **Key finding**: No competitor offers predictive lead intelligence from property data — our core differentiator
- **Key gap**: We lack QuickBooks integration, GPS tracking, automated SMS, online booking — table stakes features
- **AI trend**: 38% of contractors using AI, 70%+ report AI tool usage, admin workload reduced 30-50%
- **AI opportunity**: AI-powered estimate generation is an emerging space no major FSM platform owns yet
- **Atlanta market**: 19,529 new permits (12% decline), growth migrating to Barrow/Hall/Douglas counties, Forsyth getting 140-acre mixed-use development
- **Payment insight**: ACH costs $5 max vs $29+ for credit card on $1,000 invoice — should add ACH option
- **Growth insight**: SEO is highest-ROI channel (CAC $205), interactive onboarding is highest-leverage retention investment
- **Added**: 9 new research-driven backlog items with priority levels and source links
- **Updated**: RESEARCH.md with 5 major sections, all sourced

### 2026-04-03 — First Improvement Cycle (Security & Quality)
- **Audit**: 3-agent parallel audit of server routes (19 files), frontend pages (16 files), and project brain
- **Server findings**: 6 authorization gaps, near-zero input validation, JSON.parse crash risk, inconsistent error responses
- **Frontend findings**: No toast system, missing error boundaries, accessibility gaps (labels, aria), mobile table issues
- **Fixes applied**:
  - Added JWT_SECRET validation on server startup (exits in production if missing)
  - Added ownership checks to: GET change-orders, GET/POST messages, POST campaign recipients
  - Added admin-only check to PUT subdivisions
  - Fixed JSON.parse crash in campaigns plan generator
  - Added message validation (empty check, trim)
- **Impact**: Closed 6 authorization gaps, prevented 1 crash path, hardened production deployment
- **Remaining**: Input validation middleware, toast system, error boundaries, accessibility audit (logged in BACKLOG.md)

### 2026-04-03 — Project Brain Initialized
- Created project-brain/ directory with 8 files (MISSION, HISTORY, ARCHITECTURE, DECISIONS, BACKLOG, PATTERNS, USER-INSIGHTS, RESEARCH)
- Created CLAUDE.md at project root as AI assistant instructions
- Populated all brain files from exhaustive codebase analysis
- Why: Establish persistent intelligence system for project continuity across sessions

### 2026-04-03 — Full Polish Pass & Performance Optimization
- Converted 30+ page imports to React.lazy() with Suspense boundary
- Main bundle reduced from 1,594 KB to 741 KB (53% reduction)
- Fixed missing ProjectList/ProjectDetail lazy imports that broke the app
- Removed dynamic authStore import from fetchAPI (was causing module duplication)
- Added focus-visible styles, skeleton loader animation, custom scrollbar, print styles to globals.css
- Why: Bundle was too large, pages loaded slowly, accessibility needed improvement

### 2026-04-03 — Settings & Account Management
- Migration 022: Added address/city/state/logo_url/tagline/notification prefs to users, created team_invites table
- New /api/settings routes: team management (invite/revoke) + CSV data export (projects/invoices/leads/clients)
- Rebuilt Settings.jsx with 5 tabs: Profile, Subscription, Team, Notifications, Data Export
- Updated /api/auth/me PUT to accept 18+ profile fields
- Why: Contractors need full account management, team delegation, and data portability

### 2026-04-03 — Client Portal System
- Migration 021: Created client_portal_tokens, client_messages tables; added portal_enabled/client_response fields
- New /api/portal/:token routes (12 endpoints): job detail, invoices, PDF, change orders (approve/reject), messages
- New portalAuth.js middleware: SHA-256 token validation, 90-day expiry, scoped to single job
- Portal management endpoints on /api/jobs: enable/revoke/status + messaging
- Frontend: PortalLayout, PortalDashboard, PortalInvoices, PortalChangeOrders, PortalMessages
- Portal uses token-in-URL auth (no login required), completely separate from JWT auth
- Why: Contractors need to share project status with homeowner clients professionally

### 2026-04-03 — Marketing & Email Campaign System
- Migration 020: Created campaigns, campaign_recipients, marketing_plans tables
- New /api/campaigns routes: CRUD, recipient management, send, marketing plan generator
- Marketing plan generator queries subdivision database for trade-matched opportunities, outputs quarterly action plan
- Added 5 new email templates: cold_outreach, quote_follow_up, project_thank_you, seasonal_reminder, referral_request (total: 12)
- Built MarketingHub.jsx with 5 tabs: Compose, Templates, Campaigns, Marketing Plan, Sent
- Why: Contractors need guided marketing tools — most have never done email outreach

### 2026-04-03 — Invoicing System Complete
- Migration 019: Added discount_amount/type, payment_terms, payment_method, viewed_at to invoices; created invoice_status_history table
- Rebuilt invoices.js with full lifecycle: create → send (with email) → viewed → paid/overdue
- PDF generation with contractor branding, line items, discounts, tax, payment terms
- Frontend: InvoiceList (4 summary cards), InvoiceForm (discount/tax/terms), InvoiceDetail (status actions, history timeline)
- Fixed PDF download to use authenticated fetch+blob instead of window.open
- Why: Professional invoicing is core to contractor workflow — must be bulletproof

### 2026-04-03 — Pipeline Feature (Unified Kanban)
- Rebuilt LeadPipeline.jsx as unified pipeline combining leads AND projects
- 8 stages: New Leads → Contacted → Quoted → Negotiating → Won → In Progress → Completed → Lost
- Drag-and-drop persists to database (leads update stage, projects update status)
- Card detail drawer with quick actions: convert to project, create invoice, add note
- Board + List view toggle, source filter (all/leads/projects), service filter
- Stats bar: total items, pipeline value, conversion rate
- Why: Previous pipeline only showed leads — contractors need one view of their entire business

### 2026-04-03 — Project Management Feature
- Migration 018: Added client_name/email/phone/address/description/estimated_cost/photos to contractor_jobs; created change_orders and job_activities tables
- Rebuilt contractor-jobs.js with full CRUD, change orders (auto-numbered CO-01), activity logging, status change auditing
- Frontend: ProjectList (searchable/filterable), ProjectForm (create from lead with auto-fill), JobDetail (3-column: details+changes+timeline / financials+invoices+status)
- Lead-to-project conversion: creating from lead auto-marks lead as "won"
- Why: Contractors need to track every aspect of a job — not just that it exists

### 2026-04-03 — Interactive Map & Lead Discovery
- Migration 017: Added latitude/longitude to subdivisions table
- Backfilled 144 subdivisions with coordinates from hardcoded MapView data
- Updated /api/subdivisions with trade/year/zip/urgency filters
- Built LeadsAndMap.jsx: full-width Leaflet map + list view toggle, filter toolbar, create lead modal
- Map markers color-coded by urgency, sized by home count, blue ring for existing leads
- Click popup shows: urgency, trade-specific %, build year, value, add lead / view details
- Why: This is the core differentiator — finding work through data instead of cold calling

### 2026-04-03 — Contractor Dashboard & Navigation Redesign
- Rebuilt ContractorDashboard.jsx: welcome header, 4 clickable metric cards, quick actions, pipeline overview bar, recent activity feed, upcoming jobs, invoice summary
- Updated Sidebar.jsx: contractor nav (Dashboard, Leads & Map, Projects, Pipeline, Invoicing, Marketing, Client Portal, Settings) vs admin nav
- Dashboard shows different content per tier (starter: 3 opps, pro: 5 opps, locked actions)
- Why: Pivoted from admin/operator tool to contractor-facing SaaS product

### 2026-04-03 — Subscription Tier System & Auth
- Migrations 010-012: Created users, refresh_tokens tables; added contractor profile fields
- Built JWT auth: register, login, refresh, logout, profile management
- 3 subscription tiers: Starter ($49), Professional ($149), Business ($299)
- Tier enforcement: middleware (requireTier), frontend (TierGate component, lock icons)
- Admin "View As" tier switcher for auditing
- Simplified to long-lived access tokens stored in localStorage (refresh token rotation was incompatible with React StrictMode)
- Why: SaaS revenue model requires gated access; pricing competitive with Jobber/Housecall Pro

### 2026-04-03 — Landing Page
- Built full landing page with real app screenshots (captured via Puppeteer)
- 5 feature sections with alternating layout, each with real screenshot
- Pricing comparison (3 tiers), testimonials, how-it-works, footer
- Removed Atlanta-specific language for national expansion
- "/" route shows landing for visitors, redirects to /dashboard for authenticated users
- Why: Need a professional public-facing page to convert visitors to trial signups

### 2026-04-03 — Research & Data Expansion
- Expanded from 580 properties → 7,504 properties across 144 subdivisions
- Added 56 contractors with verified contact info (14 with confirmed emails)
- 28 ZIP codes across 8 counties: Forsyth, Fulton, Gwinnett, Cherokee, Cobb, DeKalb, Hall, Barrow
- HOA management company data for 16 subdivisions
- HOA dues data for 56 subdivisions, websites for 28
- All data sourced from web research: qPublic, HOA websites, Yelp, BBB, management company sites
- Why: Platform value depends on data density — more subdivisions = more opportunities for contractors

### 2026-04-03 — Initial Build (Phases 1-8)
- Phase 1: Monorepo setup, database schema, layout, routing
- Phase 2: CSV data import, property database, subdivision aggregation
- Phase 3: Maintenance prediction engine, urgency scoring (weighted: HVAC 30%, roof 25%, water heater 20%, paint 15%, other 10%)
- Phase 4: CRM contacts, activity tracking, pipeline kanban
- Phase 5-7: Dashboard, email system (Resend), projects, reports, CSV export
- Phase 8: Demo mode with fallback data, GitHub Pages deployment, responsive design
- Production deployment configured for Render.com with persistent SQLite disk
- Git history: 17 commits tracking incremental feature development

### Earlier — Business Model Evolution
- Started as "HomeSync — Predictive Neighborhood Maintenance" operator tool
- Original model: Operator coordinates group-rate contractor deals with HOA boards
- Pivoted to contractor SaaS: Contractors pay subscription to access lead data and business tools
- Rationale: SaaS generates revenue faster, removes HOA sales bottleneck, scales more naturally
- Hybrid retained: group-deal coordination available as premium feature

---
This file is append-only. Never delete entries. If a decision was reversed, add a new entry explaining the reversal.
