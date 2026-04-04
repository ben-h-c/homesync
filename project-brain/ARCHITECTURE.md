# Architecture & Technical Reference

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend Framework | React | 18.3.0 | UI rendering |
| Build Tool | Vite | 5.4.0 | Development server + bundling |
| Styling | Tailwind CSS | 3.4.0 | Utility-first CSS |
| State Management | Zustand | 4.5.0 | Lightweight store (authStore, portalStore) |
| Routing | React Router DOM | 6.26.0 | HashRouter for GitHub Pages compat |
| Charts | Recharts | 2.12.0 | Dashboard visualizations |
| Maps | Leaflet + React Leaflet | 1.9.4 / 4.2.1 | Interactive subdivision map |
| Tables | TanStack React Table | 8.20.0 | Sortable/filterable data tables |
| Icons | Lucide React | 0.400.0 | SVG icon library |
| Backend | Express.js | 4.21.0 | REST API server |
| Database | SQLite via better-sqlite3 | 11.3.0 | Embedded database |
| Query Builder | Knex.js | 3.1.0 | Migrations, seeds, queries |
| Auth | JSON Web Tokens | 9.0.3 | 7-day access tokens |
| Password Hashing | bcryptjs | 3.0.3 | 12-round bcrypt |
| PDF Generation | PDFKit | 0.18.0 | Invoice and report PDFs |
| Email | Resend SDK | 6.10.0 | Transactional email (falls back to mock) |
| CSV Parsing | csv-parse | 5.5.0 | Property data import |
| Screenshots | Puppeteer | 24.40.0 | Automated screenshots for landing page |

## Folder Structure

```
homesync/
├── CLAUDE.md                    # AI assistant instructions
├── package.json                 # Monorepo root (workspaces: client, server)
├── render.yaml                  # Render.com deployment config
├── .env.example                 # Environment variable template
├── project-brain/               # Persistent project intelligence
│   ├── MISSION.md
│   ├── HISTORY.md
│   ├── ARCHITECTURE.md          # (this file)
│   ├── DECISIONS.md
│   ├── BACKLOG.md
│   ├── PATTERNS.md
│   ├── USER-INSIGHTS.md
│   └── RESEARCH.md
│
├── client/                      # React frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── public/
│   │   └── screenshots/         # Real app screenshots for landing page (9 PNGs)
│   └── src/
│       ├── main.jsx             # React entry point
│       ├── App.jsx              # Route definitions (162 lines, lazy-loaded)
│       ├── api/
│       │   └── client.js        # fetchAPI wrapper with demo fallback
│       ├── store/
│       │   ├── authStore.js     # Zustand: user, token, tier, viewAsTier
│       │   └── portalStore.js   # Zustand: portal token, data, fetch helpers
│       ├── components/          # 12 shared components
│       │   ├── Layout.jsx       # App shell (sidebar + header + content)
│       │   ├── Sidebar.jsx      # Navigation (contractor vs admin nav)
│       │   ├── AuthGuard.jsx    # Route protection
│       │   ├── TierGate.jsx     # Subscription tier gating
│       │   ├── GlobalSearch.jsx # Cross-entity search
│       │   ├── UrgencyBadge.jsx # Color-coded urgency display
│       │   ├── MaintenanceBar.jsx # Stacked urgency bar
│       │   ├── ActivityFeed.jsx # Timeline component
│       │   └── ...
│       ├── pages/               # 34 page components
│       │   ├── Landing.jsx      # Public landing page with screenshots
│       │   ├── Login.jsx        # Login form
│       │   ├── Register.jsx     # Signup with trade selection
│       │   ├── ContractorDashboard.jsx  # Main contractor view
│       │   ├── LeadsAndMap.jsx  # Interactive map + lead table
│       │   ├── LeadPipeline.jsx # Unified kanban pipeline
│       │   ├── JobDetail.jsx    # Project detail with change orders
│       │   ├── InvoiceForm.jsx  # Invoice builder with line items
│       │   ├── MarketingHub.jsx # Email, campaigns, plan generator
│       │   ├── Settings.jsx     # Profile, subscription, team, export
│       │   └── portal/          # Client portal (5 pages)
│       │       ├── PortalLayout.jsx
│       │       ├── PortalDashboard.jsx
│       │       ├── PortalInvoices.jsx
│       │       ├── PortalChangeOrders.jsx
│       │       └── PortalMessages.jsx
│       ├── demo-data/           # 7 JSON files for offline/demo mode
│       └── styles/
│           └── globals.css      # Tailwind + custom styles
│
├── server/                      # Express backend
│   ├── package.json
│   ├── index.js                 # Server entry, route mounting
│   ├── db.js                    # Knex database connection
│   ├── routes/                  # 19 route files
│   │   ├── auth.js              # Register, login, profile, password
│   │   ├── contractor-jobs.js   # Jobs, change orders, portal, messages
│   │   ├── contractor-leads.js  # Lead CRUD
│   │   ├── contractor-dashboard.js # Dashboard aggregation
│   │   ├── invoices.js          # Invoicing, PDF gen, status workflow
│   │   ├── client-portal.js     # Public portal endpoints
│   │   ├── campaigns.js         # Email campaigns, marketing plans
│   │   ├── settings.js          # Team, export, preferences
│   │   ├── subdivisions.js      # Subdivision data + filtering
│   │   ├── properties.js        # Property CRUD + import
│   │   ├── contacts.js          # CRM contacts
│   │   ├── emails.js            # Email sending + templates
│   │   ├── maintenance.js       # Rules + forecasting
│   │   ├── reports.js           # Dashboard stats + PDF reports
│   │   ├── admin.js             # User management, MRR stats
│   │   ├── proposals.js         # Proposal CRUD
│   │   ├── projects.js          # Group projects
│   │   ├── activities.js        # Activity logging
│   │   └── import.js            # CSV import preview
│   ├── services/                # 4 business logic modules
│   │   ├── maintenanceEngine.js # Urgency scoring algorithm
│   │   ├── emailService.js      # Resend integration
│   │   ├── csvProcessor.js      # CSV parsing + mapping
│   │   └── subdivisionAggregator.js # Property → subdivision rollup
│   ├── middleware/
│   │   ├── auth.js              # JWT + tier enforcement
│   │   └── portalAuth.js        # Token-based portal auth
│   └── utils/
│       └── tokens.js            # JWT + refresh token helpers
│
├── database/
│   ├── knexfile.js              # Knex config (SQLite)
│   ├── homesync.db              # SQLite database file
│   ├── migrations/              # 22 migration files (001-022)
│   └── seeds/                   # 3 seed files
│
└── scripts/                     # 9 utility scripts
    ├── setup.sh                 # Initial setup
    ├── test-data.csv            # Sample import CSV
    ├── take-screenshots.js      # Puppeteer screenshots
    └── sweep-*.js               # Data population scripts (5 files)
```

## Database Schema (30 tables)

### Users & Auth
- **users**: id, email, password_hash, first_name, last_name, company_name, phone, role (admin/subscriber), subscription_tier (starter/pro/enterprise), subscription_status, trial_ends_at, trade_category, zip_code, service_radius_miles, license_number, insurance_verified, business_description, tagline, default_tax_rate, payment_terms, address, city, state, logo_url, notification preferences (4 columns), stripe fields (2), metro_areas, subdivision_views_used/reset_at, user_type, last_login_at, created_at, updated_at
- **refresh_tokens**: id, user_id (FK→users), token_hash, expires_at, revoked, created_at
- **team_invites**: id, invited_by (FK→users), email, role, status, token_hash, accepted_at, created_at

### Property Intelligence
- **properties**: id, parcel_id (unique), address, city, state, zip, subdivision, owner_name, owner_mailing_address, year_built, square_footage, bedrooms, bathrooms, assessed_value, lot_size_acres, property_type, latitude, longitude, hvac_year_installed, water_heater_year, roof_year, exterior_paint_year, last_updated, notes, created_at
- **subdivisions**: id, name, zip, total_homes, year_built_min/max/mode, avg_square_footage, avg_assessed_value, maintenance_urgency_score, hvac_pct_due, roof_pct_due, water_heater_pct_due, paint_pct_due, pipeline_stage, hoa_name, hoa_management_company, hoa_contact_name/email/phone, hoa_website, hoa_meeting_schedule, hoa_dues_monthly, latitude, longitude, portal_enabled, portal_token_sent_at, last_contacted, updated_at
- **maintenance_rules**: id, system_name, display_name, avg_lifespan_years, warning_years_before, critical_years_after, avg_replacement_cost_low/high, group_discount_typical, is_recurring

### Contractor Operations
- **contractor_leads**: id, user_id (FK→users), subdivision_id (FK→subdivisions), contact_id (FK→contacts), stage (new/contacted/proposal_sent/negotiating/won/lost), service_type, estimated_value, estimated_homes, notes, next_follow_up, won_date, lost_reason, created_at, updated_at
- **proposals**: id, user_id, lead_id, subdivision_id, contact_id, title, service_type, scope_of_work, estimated_homes, price_per_home, total_amount, group_discount_pct, valid_until, status (draft/sent/viewed/accepted/rejected/expired), sent_at, accepted_at, notes, created_at, updated_at
- **contractor_jobs**: id, user_id, proposal_id, lead_id, subdivision_id, title, service_type, status (not_started/in_progress/on_hold/completed/cancelled), description, client_name/email/phone/address, estimated_cost, total_homes, homes_completed, total_revenue, start_date, end_date, completed_at, photos (JSON), notes, portal_enabled, portal_token_sent_at, created_at, updated_at
- **change_orders**: id, job_id (FK→contractor_jobs CASCADE), user_id, change_order_number, description, cost_impact, reason, status (proposed/approved/rejected), client_response, client_responded_at, client_note, approved_at, approved_by, created_at, updated_at
- **job_activities**: id, job_id (FK CASCADE), user_id, type (status_change/note/photo/change_order/invoice), description, old_value, new_value, created_at

### Invoicing
- **invoices**: id, user_id (FK CASCADE), job_id (FK→contractor_jobs), invoice_number (unique), customer_name/email/address/phone, subdivision_id, contact_id, status (draft/sent/viewed/paid/overdue/cancelled), issue_date, due_date, subtotal, tax_rate, tax_amount, total, amount_paid, discount_amount, discount_type (flat/percent), payment_terms, payment_method, notes, viewed_at, sent_at, paid_at, created_at, updated_at
- **invoice_line_items**: id, invoice_id (FK CASCADE), service, description, quantity, unit_price, amount, sort_order
- **invoice_status_history**: id, invoice_id (FK CASCADE), from_status, to_status, note, created_at

### Communication & Portal
- **emails**: id, contact_id, to_email, to_name, from_email, subject, body_html, body_text, template_used, status, resend_id, related_project_id, related_subdivision_id, sent_at
- **email_templates**: id, name, subject_template, body_html_template, body_text_template, category, description, created_at, updated_at
- **campaigns**: id, user_id, name, subject, body_html, template_id, status (draft/scheduled/sending/sent/cancelled), scheduled_at, sent_at, total_recipients/sent/opened/clicked, recipient_source, recipient_filter, notes, created_at, updated_at
- **campaign_recipients**: id, campaign_id (FK CASCADE), email, name, status (pending/sent/opened/clicked/bounced), sent_at, opened_at
- **client_portal_tokens**: id, job_id (FK CASCADE), contractor_user_id (FK CASCADE), client_email, client_name, token_hash (unique), expires_at, revoked, last_accessed_at, created_at
- **client_messages**: id, job_id (FK CASCADE), sender_type (client/contractor), sender_name, message, read_at, created_at
- **marketing_plans**: id, user_id, name, target_services, target_areas, budget, goals, plan_content (JSON), status, created_at, updated_at
- **password_reset_tokens**: id, user_id (FK CASCADE), token_hash, expires_at, used_at, created_at
- **notifications**: id, user_id (FK CASCADE), type, title, message, link, related_job_id, related_invoice_id, read_at, created_at

### Legacy/Admin
- **contacts**: id, type (contractor/hoa/homeowner), first_name, last_name, email, phone, company, title, subdivision, address, contractor_services (JSON), contractor_license_number, contractor_insurance_verified, contractor_rating, contractor_group_rate_discount, status, source, tags (JSON), notes, last_contacted, created_at, updated_at
- **activities**: id, contact_id, subdivision_id, project_id, type, subject, description, outcome, created_at
- **projects**: id, name, subdivision_id, service_type, contractor_id, status, retail_price, group_price, sign_up_deadline, service_start_date, service_end_date, homes_signed_up, homes_completed, total_revenue, notes, created_at, updated_at
- **project_signups**: id, project_id, property_id, contact_id, homeowner_name/email/phone, address, status, scheduled_date, completed_date, payment_status, notes, created_at

## API Routes

### Public (no auth)
- `POST /api/auth/register` — Create account (sends welcome email)
- `POST /api/auth/login` — Get JWT tokens
- `POST /api/auth/refresh` — Refresh access token
- `POST /api/auth/forgot-password` — Send password reset email (anti-enumeration)
- `POST /api/auth/reset-password` — Reset password with token
- `GET /api/portal/:token` — Validate portal token, get job summary
- `GET /api/portal/:token/timeline` — Job activity log
- `GET /api/portal/:token/invoices` — Client invoice list
- `GET /api/portal/:token/invoices/:id` — Invoice detail
- `GET /api/portal/:token/invoices/:id/pdf` — Invoice PDF download
- `GET /api/portal/:token/change-orders` — Change order list
- `POST /api/portal/:token/change-orders/:id/respond` — Approve/reject
- `GET /api/portal/:token/messages` — Message thread
- `POST /api/portal/:token/messages` — Send message

### Authenticated (all tiers)
- `GET/PUT /api/auth/me` — Profile management
- `POST /api/auth/change-password`
- `POST /api/auth/logout`
- `GET /api/subdivisions` — List with filters (trade, year, zip, urgency)
- `GET /api/subdivisions/:id` — Detail (5/month limit for starter)
- `GET /api/contractor/dashboard` — Aggregated stats
- `GET/POST/PUT/DELETE /api/leads` — Lead pipeline CRUD
- `GET/POST/PUT/DELETE /api/jobs` — Project management
- `POST /api/jobs/:id/activity` — Add note
- `GET/POST/PUT /api/jobs/:id/change-orders` — Change orders
- `POST /api/jobs/:id/portal/enable` — Generate client portal
- `POST /api/jobs/:id/portal/revoke` — Revoke access
- `GET /api/jobs/:id/messages` — Job messages
- `POST /api/jobs/:id/messages` — Send message
- `GET/POST/PUT /api/invoices` — Invoice CRUD
- `GET /api/invoices/next-number` — Auto-increment
- `GET /api/invoices/stats` — Revenue metrics
- `POST /api/invoices/:id/send` — Send to client
- `POST /api/invoices/:id/mark-paid` — Record payment
- `GET /api/invoices/:id/pdf` — PDF download
- `GET /api/maintenance/rules` — Lifecycle rules
- `GET /api/maintenance/forecast/:id` — Subdivision forecast
- `POST /api/maintenance/recalculate-all`
- `GET /api/settings/team` — Team members
- `POST /api/settings/team/invite` — Invite member
- `GET /api/settings/export/:type` — CSV export (projects/invoices/leads/clients)

### Pro+ Only
- `GET/POST/PUT /api/contacts` — CRM
- `POST /api/emails/send` — Email sending
- `GET/POST/PUT /api/emails/templates` — Email templates
- `GET/POST/PUT /api/campaigns` — Campaign management
- `POST /api/campaigns/:id/send` — Send campaign
- `POST /api/campaigns/plans/generate` — Marketing plan generator
- `POST /api/import/preview` — CSV import

### Admin Only
- `GET/PUT/DELETE /api/admin/users` — User management
- `GET /api/admin/stats` — MRR, user counts
- `GET /api/properties` — Property data
- `GET /api/reports/dashboard-stats`
- `GET /api/reports/forecast/:id/pdf` — Forecast PDF

## Third-Party Integrations

| Service | Purpose | Status |
|---|---|---|
| Resend | Transactional email (invoices, portal links, campaigns) | Active, falls back to mock if no API key |
| OpenStreetMap | Map tiles for Leaflet | Active, no API key needed |
| PDFKit | Server-side invoice and report PDF generation | Active |
| Stripe | Payment processing for subscriptions | Schema ready (stripe_customer_id, stripe_subscription_id on users table), not implemented |

## Environment Variables

| Key | Purpose |
|---|---|
| PORT | Server port (default: 3001) |
| NODE_ENV | Environment (development/production) |
| DATABASE_PATH | SQLite file path |
| JWT_SECRET | JWT signing secret (MUST override in production) |
| RESEND_API_KEY | Resend email API key (optional) |
| FROM_EMAIL | Sender email address |
| FROM_NAME | Sender display name |
| OPERATOR_NAME | Business owner name |
| OPERATOR_EMAIL | Business owner email |
| OPERATOR_PHONE | Business phone |
| BUSINESS_NAME | Company name |
| BUSINESS_TAGLINE | Company tagline |
| CORS_ORIGIN | Allowed frontend origin |
| VITE_API_URL | Frontend API base URL |
| CLIENT_URL | Full client URL (for portal links) |

## Deployment

- **Platform**: Render.com (free tier)
- **Build**: `npm install && npm run build --workspace=client && cd database && npx knex migrate:latest && npx knex seed:run`
- **Start**: `node server/index.js` (serves both API and built client)
- **Database**: SQLite on 1GB persistent disk at `/opt/render/project/src/database`
- **Demo**: GitHub Pages at `/homesync/` subpath (client-only with demo data)

---
Last updated: 2026-04-03
