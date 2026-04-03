# HomeSync — Predictive Neighborhood Maintenance Platform
## Complete Technical Specification & Business Plan
### Master Build Document for Claude Code

---

## TABLE OF CONTENTS

1. [Business Context](#1-business-context)
2. [Product Overview](#2-product-overview)
3. [Architecture & Tech Stack](#3-architecture--tech-stack)
4. [Database Schema](#4-database-schema)
5. [Data Ingestion — Property Records](#5-data-ingestion--property-records)
6. [Predictive Maintenance Engine](#6-predictive-maintenance-engine)
7. [Frontend Pages & Components](#7-frontend-pages--components)
8. [Backend API Endpoints](#8-backend-api-endpoints)
9. [CRM Module](#9-crm-module)
10. [Email System](#10-email-system)
11. [Reports & Export](#11-reports--export)
12. [GitHub Pages Deployment](#12-github-pages-deployment)
13. [File & Folder Structure](#13-file--folder-structure)
14. [Implementation Order](#14-implementation-order)
15. [Environment Variables & Configuration](#15-environment-variables--configuration)
16. [Design System](#16-design-system)

---

## 1. BUSINESS CONTEXT

### What is HomeSync?

HomeSync is a business tool for a one-person operator running a **predictive neighborhood maintenance coordination business** in ZIP code 30041 (Cumming / Forsyth County, Georgia).

### The Business Model

Forsyth County's 28,000+ homes were built in construction waves (primarily 2000–2020). Homes built in the same subdivision share the same build year, which means their major systems (HVAC, water heater, roof, exterior paint, etc.) all reach end-of-life at the same time.

The operator:
1. Uses public property records to identify which subdivisions need which maintenance NOW
2. Contacts HOA boards with a "Neighborhood Maintenance Forecast" showing what's due
3. Pre-negotiates group rates with licensed contractors (25–40% below retail)
4. Coordinates sign-ups from homeowners, schedules the work, ensures quality
5. Earns a coordination fee ($15–$30 per home per service) while saving homeowners money

### What This Platform Must Do

This is an **internal business operations tool** — not a public-facing marketing site (though it should have a clean public landing page). It must:

- **Ingest and organize property data** from Forsyth County public records
- **Predict maintenance needs** based on build year and system lifecycle data
- **Manage relationships** (HOA contacts, contractors, homeowners) as a CRM
- **Generate reports** (Neighborhood Maintenance Forecasts) to pitch HOA boards
- **Send emails** to contacts (HOA boards, homeowners, contractors)
- **Track the sales pipeline** (which HOAs have been pitched, what stage they're in)
- **Track projects** (active service campaigns, sign-ups, completion status)
- **Present dashboards** with actionable data at a glance

### Target Geography

- **Primary**: ZIP 30041 (Cumming, GA — east/south Forsyth County, borders Lake Lanier)
- **Expansion**: ZIP 30040, 30028, 30518, 30024 (adjacent Forsyth County ZIPs)
- **Data source**: Forsyth County Board of Assessors via qPublic (https://qpublic.schneidercorp.com/Application.aspx?App=ForsythCountyGA)

---

## 2. PRODUCT OVERVIEW

### User Roles

There is only one user role: **the operator** (you). This is a single-user tool. No authentication system needed initially — just protect behind a simple environment-variable password if desired for the local server.

### Core Modules

| Module | Purpose |
|--------|---------|
| **Dashboard** | At-a-glance view of pipeline, hot subdivisions, upcoming projects, revenue |
| **Property Database** | Searchable/filterable database of all properties in target ZIPs |
| **Subdivision Intel** | Aggregated view per subdivision: # homes, build year, maintenance forecast, HOA info |
| **Maintenance Forecaster** | Engine that calculates what each home/subdivision needs based on build year |
| **CRM — Contacts** | Manage HOA board members, contractors, homeowners. Notes, tags, activity log |
| **CRM — Pipeline** | Track HOA pitches through stages: Research → Contacted → Meeting Scheduled → Pitched → Approved → Active → Completed |
| **Projects** | Track active service campaigns: which subdivision, which service, sign-up count, contractor assigned, status |
| **Email Composer** | Write and send emails to contacts. Templates for common messages. Track sent history |
| **Report Generator** | Generate Neighborhood Maintenance Forecasts as printable/PDF reports |
| **Contractor Manager** | Track contractor info, services, pricing, availability, ratings |

---

## 3. ARCHITECTURE & TECH STACK

### Overview

This is a **monorepo** with a React frontend and a Node.js/Express backend using SQLite.

```
homesync/
├── client/          # React frontend (Vite)
├── server/          # Express.js backend
├── database/        # SQLite database file + migrations
├── scripts/         # Data ingestion scripts (property scraping/import)
├── docs/            # This spec, plus generated reports
├── .github/         # GitHub Actions for Pages deployment
├── package.json     # Root package.json (workspaces)
└── README.md
```

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React 18 + Vite | Fast dev, easy GitHub Pages deploy via `vite build` |
| **Routing** | React Router v6 | Client-side routing, works with GitHub Pages (HashRouter) |
| **UI Framework** | Tailwind CSS | Rapid styling, utility-first, consistent design |
| **Charts** | Recharts | React-native charting, lightweight |
| **Tables** | TanStack Table (React Table v8) | Sortable, filterable, paginated data tables |
| **Icons** | Lucide React | Clean, consistent icon set |
| **State** | Zustand | Lightweight global state (simpler than Redux) |
| **Backend** | Express.js | Minimal, flexible, Claude Code handles it well |
| **Database** | SQLite via better-sqlite3 | Zero-config, file-based, like Trader Ben's architecture |
| **ORM** | Knex.js | Query builder with migration support for SQLite |
| **Email** | Resend (free tier: 100 emails/day, 3000/month) | Simple API, generous free tier, good deliverability |
| **PDF Generation** | PDFKit (server-side) | Generate Neighborhood Maintenance Forecast reports |
| **CSV Import/Export** | PapaParse (client) + csv-parse (server) | Flexible CSV handling for property data import |
| **Deployment** | GitHub Pages (frontend) + local server (backend) | Free hosting for demo; local server for full functionality |

### How GitHub Pages Works with This

- The React frontend is built as a static site and deployed to GitHub Pages
- When running locally for real use, the Express backend serves the API at `localhost:3001`
- The frontend detects whether the backend is available:
  - If YES → full functionality (real data, email, etc.)
  - If NO (GitHub Pages demo) → falls back to sample/mock data for demonstration
- This means the GitHub Pages version is a **live demo** and the local version is the **production tool**

### Key Dependency Versions (pin these)

```json
{
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "react-router-dom": "^6.26.0",
  "vite": "^5.4.0",
  "@vitejs/plugin-react": "^4.3.0",
  "tailwindcss": "^3.4.0",
  "recharts": "^2.12.0",
  "@tanstack/react-table": "^8.20.0",
  "lucide-react": "^0.400.0",
  "zustand": "^4.5.0",
  "express": "^4.21.0",
  "better-sqlite3": "^11.3.0",
  "knex": "^3.1.0",
  "resend": "^4.0.0",
  "pdfkit": "^0.15.0",
  "papaparse": "^5.4.0",
  "csv-parse": "^5.5.0",
  "cors": "^2.8.5",
  "dotenv": "^16.4.0"
}
```

---

## 4. DATABASE SCHEMA

SQLite database file location: `database/homesync.db`

Use Knex.js migrations so the schema is version-controlled and reproducible.

### Tables

#### `properties`
The core table. One row per property/parcel.

```sql
CREATE TABLE properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parcel_id TEXT UNIQUE NOT NULL,          -- County parcel ID (e.g., "090-000-123")
  address TEXT NOT NULL,                    -- Full street address
  city TEXT DEFAULT 'Cumming',
  state TEXT DEFAULT 'GA',
  zip TEXT NOT NULL,                        -- 30041, 30040, etc.
  subdivision TEXT,                         -- Subdivision name (CRITICAL field)
  owner_name TEXT,                          -- From public records
  owner_mailing_address TEXT,              -- May differ from property address
  year_built INTEGER,                       -- Build year from assessor
  square_footage INTEGER,
  bedrooms INTEGER,
  bathrooms REAL,                           -- 2.5, 3.0, etc.
  assessed_value INTEGER,                  -- County assessed value in dollars
  lot_size_acres REAL,
  property_type TEXT DEFAULT 'Single Family', -- Single Family, Townhome, Condo
  latitude REAL,                            -- For map display (geocode later)
  longitude REAL,
  -- Maintenance tracking
  hvac_year_installed INTEGER,             -- Defaults to year_built if unknown
  water_heater_year INTEGER,               -- Defaults to year_built if unknown
  roof_year INTEGER,                        -- Defaults to year_built if unknown
  exterior_paint_year INTEGER,             -- Defaults to year_built if unknown
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_properties_subdivision ON properties(subdivision);
CREATE INDEX idx_properties_zip ON properties(zip);
CREATE INDEX idx_properties_year_built ON properties(year_built);
```

#### `subdivisions`
Aggregated subdivision-level data and HOA info.

```sql
CREATE TABLE subdivisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,               -- Must match properties.subdivision
  zip TEXT,
  total_homes INTEGER,                     -- Calculated from properties count
  year_built_min INTEGER,                  -- Earliest build year
  year_built_max INTEGER,                  -- Latest build year
  year_built_mode INTEGER,                 -- Most common build year
  avg_square_footage INTEGER,
  avg_assessed_value INTEGER,
  -- HOA Information
  hoa_name TEXT,
  hoa_management_company TEXT,
  hoa_contact_name TEXT,
  hoa_contact_email TEXT,
  hoa_contact_phone TEXT,
  hoa_meeting_schedule TEXT,               -- e.g., "First Tuesday monthly"
  hoa_website TEXT,
  hoa_dues_monthly REAL,
  -- Maintenance scores (calculated by engine)
  maintenance_urgency_score REAL,          -- 0-100, higher = more urgent
  hvac_pct_due REAL,                       -- % of homes with HVAC at end-of-life
  roof_pct_due REAL,
  water_heater_pct_due REAL,
  paint_pct_due REAL,
  -- Pipeline tracking
  pipeline_stage TEXT DEFAULT 'research',  -- research, contacted, meeting_scheduled, pitched, approved, active, completed, declined
  pipeline_notes TEXT,
  last_contacted TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `contacts`
CRM contacts — HOA board members, contractors, homeowners who opt in.

```sql
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,                       -- 'hoa_board', 'contractor', 'homeowner', 'other'
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,                             -- HOA name, contractor company, etc.
  title TEXT,                               -- "Board President", "Owner", etc.
  subdivision TEXT,                         -- Links to subdivision name
  address TEXT,
  -- Contractor-specific fields
  contractor_services TEXT,                -- JSON array: ["hvac", "plumbing", "roofing"]
  contractor_license_number TEXT,
  contractor_insurance_verified BOOLEAN DEFAULT 0,
  contractor_rating REAL,                  -- 1-5 star rating
  contractor_group_rate_discount REAL,     -- e.g., 0.30 for 30% discount
  -- Status
  status TEXT DEFAULT 'active',            -- active, inactive, do_not_contact
  source TEXT,                             -- 'qpublic', 'nextdoor', 'referral', 'hoa_meeting', 'manual'
  tags TEXT,                               -- JSON array of tags
  notes TEXT,
  last_contacted TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_contacts_subdivision ON contacts(subdivision);
```

#### `activities`
Activity log for CRM — tracks all interactions.

```sql
CREATE TABLE activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER REFERENCES contacts(id),
  subdivision_id INTEGER REFERENCES subdivisions(id),
  project_id INTEGER REFERENCES projects(id),
  type TEXT NOT NULL,                       -- 'email_sent', 'phone_call', 'meeting', 'note', 'pitch', 'follow_up', 'status_change'
  subject TEXT,
  description TEXT,
  outcome TEXT,                            -- 'positive', 'neutral', 'negative', 'no_response'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_activities_subdivision ON activities(subdivision_id);
```

#### `projects`
Active service campaigns — one project = one service in one subdivision.

```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                       -- e.g., "Bridgetown HVAC Tune-Up Spring 2026"
  subdivision_id INTEGER REFERENCES subdivisions(id),
  service_type TEXT NOT NULL,              -- 'hvac_tuneup', 'hvac_replacement', 'water_heater', 'roof_inspection', 'pressure_washing', 'gutter_cleaning', 'exterior_paint', 'driveway_sealing', 'deck_staining'
  contractor_id INTEGER REFERENCES contacts(id),
  status TEXT DEFAULT 'planning',          -- planning, sign_ups_open, scheduled, in_progress, completed, cancelled
  -- Pricing
  retail_price REAL,                       -- What homeowner would normally pay
  group_price REAL,                        -- Negotiated group rate
  coordination_fee REAL,                   -- Your fee per home
  total_price_to_homeowner REAL,          -- group_price + coordination_fee
  -- Counts
  total_eligible_homes INTEGER,
  homes_signed_up INTEGER DEFAULT 0,
  homes_completed INTEGER DEFAULT 0,
  -- Dates
  sign_up_deadline DATE,
  service_start_date DATE,
  service_end_date DATE,
  -- Financials
  total_revenue REAL DEFAULT 0,            -- Your total coordination fees collected
  total_contractor_cost REAL DEFAULT 0,
  -- Notes
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `project_signups`
Individual homeowner sign-ups for a project.

```sql
CREATE TABLE project_signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) NOT NULL,
  property_id INTEGER REFERENCES properties(id),
  contact_id INTEGER REFERENCES contacts(id),
  homeowner_name TEXT NOT NULL,
  homeowner_email TEXT,
  homeowner_phone TEXT,
  address TEXT NOT NULL,
  status TEXT DEFAULT 'signed_up',         -- signed_up, scheduled, completed, cancelled, no_show
  scheduled_date DATE,
  completed_date DATE,
  payment_status TEXT DEFAULT 'pending',   -- pending, paid, refunded
  amount_charged REAL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_signups_project ON project_signups(project_id);
```

#### `emails`
Sent email log.

```sql
CREATE TABLE emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER REFERENCES contacts(id),
  to_email TEXT NOT NULL,
  to_name TEXT,
  from_email TEXT DEFAULT 'hello@homesync.com',
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  template_used TEXT,                      -- Which template was used
  status TEXT DEFAULT 'sent',              -- draft, sent, delivered, opened, bounced, failed
  resend_id TEXT,                          -- Resend API message ID for tracking
  related_project_id INTEGER REFERENCES projects(id),
  related_subdivision_id INTEGER REFERENCES subdivisions(id),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `email_templates`
Reusable email templates.

```sql
CREATE TABLE email_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,               -- 'hoa_intro_pitch', 'homeowner_offer', 'contractor_inquiry', etc.
  subject_template TEXT NOT NULL,          -- Supports {{variables}}
  body_html_template TEXT NOT NULL,        -- Supports {{variables}}
  body_text_template TEXT,
  category TEXT,                           -- 'hoa', 'homeowner', 'contractor', 'follow_up'
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `maintenance_rules`
Configurable lifecycle rules for the prediction engine.

```sql
CREATE TABLE maintenance_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  system_name TEXT UNIQUE NOT NULL,        -- 'hvac', 'water_heater', 'roof', 'exterior_paint', 'driveway', 'deck', 'garage_door', 'gutter_cleaning', 'pressure_washing'
  display_name TEXT NOT NULL,
  avg_lifespan_years INTEGER NOT NULL,
  warning_years_before INTEGER DEFAULT 2,  -- Start flagging this many years before end-of-life
  critical_years_after INTEGER DEFAULT 2,  -- Considered critical this many years past end-of-life
  avg_replacement_cost_low REAL,
  avg_replacement_cost_high REAL,
  avg_maintenance_cost REAL,               -- Annual maintenance cost
  group_discount_typical REAL DEFAULT 0.30,-- Typical group discount percentage
  service_type TEXT,                        -- Maps to project.service_type
  is_recurring BOOLEAN DEFAULT 0,          -- 1 for things like gutter cleaning, pressure washing
  recurrence_months INTEGER,               -- How often for recurring services
  notes TEXT
);
```

**Pre-seed this table with these rules:**

| system_name | display_name | avg_lifespan_years | warning_years_before | cost_low | cost_high | group_discount |
|---|---|---|---|---|---|---|
| hvac | HVAC System | 15 | 2 | 4000 | 8000 | 0.30 |
| water_heater | Water Heater | 10 | 2 | 1200 | 2500 | 0.35 |
| roof | Roof (Asphalt Shingle) | 25 | 3 | 8000 | 20000 | 0.25 |
| exterior_paint | Exterior Paint | 8 | 1 | 3000 | 6000 | 0.30 |
| driveway_sealing | Driveway Sealing | 4 | 1 | 300 | 600 | 0.35 |
| deck_staining | Deck Stain/Seal | 3 | 1 | 400 | 1000 | 0.30 |
| garage_door | Garage Door/Opener | 12 | 2 | 800 | 2500 | 0.20 |
| gutter_cleaning | Gutter Cleaning | 1 | 0 | 150 | 300 | 0.40 |
| pressure_washing | Pressure Washing | 1 | 0 | 200 | 400 | 0.40 |
| water_heater_flush | Water Heater Flush | 1 | 0 | 100 | 200 | 0.40 |

---

## 5. DATA INGESTION — PROPERTY RECORDS

### Primary Data Source

Forsyth County Board of Assessors via qPublic:
- URL: `https://qpublic.schneidercorp.com/Application.aspx?App=ForsythCountyGA&PageType=Search`
- This is a public records system. Data can be searched by:
  - Owner name
  - Property address
  - Subdivision name
  - Parcel ID

### Ingestion Strategy

**OPTION A: Manual CSV Import (Start Here)**

Create a CSV import tool that accepts a CSV file with columns matching the `properties` table. The operator can:
1. Search qPublic by subdivision name
2. Manually copy/paste results into a spreadsheet
3. Export as CSV
4. Upload to HomeSync

Build a CSV import page at `/import` that:
- Accepts CSV file upload
- Previews the first 10 rows with column mapping
- Lets user map CSV columns to database fields
- Shows validation errors (missing required fields, duplicate parcel IDs)
- Imports with a progress bar
- Reports: X imported, Y skipped (duplicates), Z errors

**CSV column mapping should handle these common qPublic column names:**
- `Parcel ID` → parcel_id
- `Location Address` or `Property Address` → address
- `Owner` or `Owner Name` → owner_name
- `Mailing Address` → owner_mailing_address
- `Year Built` → year_built
- `Living Area` or `Sq Ft` or `Square Footage` → square_footage
- `Bedrooms` or `Beds` → bedrooms
- `Bathrooms` or `Baths` → bathrooms
- `Appraised Value` or `Assessed Value` or `Fair Market Value` → assessed_value
- `Subdivision` or `Neighborhood` → subdivision
- `Lot Size` → lot_size_acres
- `Zip` or `Zip Code` → zip

**OPTION B: qPublic Scraper Script (Advanced — build second)**

Create a Node.js script at `scripts/scrape-qpublic.js` that:
1. Takes a subdivision name as argument
2. Makes HTTP requests to qPublic's search endpoint
3. Parses the HTML response for property records
4. Inserts/updates records in the database
5. Respects rate limits (2-second delay between requests)
6. Logs progress and errors

**IMPORTANT**: qPublic may use ASP.NET ViewState and require session cookies. The scraper may need to:
- First request the search page to get __VIEWSTATE and __EVENTVALIDATION tokens
- Submit a POST request with those tokens + the search term
- Parse the results HTML
- Follow pagination links

Include a `scripts/scrape-config.json` with:
```json
{
  "baseUrl": "https://qpublic.schneidercorp.com/Application.aspx?App=ForsythCountyGA",
  "delayMs": 2000,
  "targetSubdivisions": [
    "Bridgetown",
    "Castleberry",
    "Windermere",
    "Brookwood",
    "Sharon Springs",
    "Lanier Springs",
    "The Park at Sawnee",
    "Vickery",
    "Bannister Park",
    "Brannon Oaks"
  ]
}
```

### Post-Import Processing

After importing properties, automatically:
1. Calculate and populate the `subdivisions` table by grouping properties by subdivision
2. Compute aggregates: total_homes, year_built_min/max/mode, avg_square_footage, avg_assessed_value
3. Run the maintenance forecaster to set maintenance_urgency_score and system-specific percentages
4. Default hvac_year_installed, water_heater_year, roof_year, exterior_paint_year to year_built for all new records

---

## 6. PREDICTIVE MAINTENANCE ENGINE

### The Algorithm

For each property, and aggregated for each subdivision:

```
For each system in maintenance_rules:
  system_age = CURRENT_YEAR - property.{system}_year_installed
  years_remaining = rule.avg_lifespan_years - system_age

  if years_remaining <= -rule.critical_years_after:
    status = "CRITICAL"    (red)    — overdue, likely failing/failed
    urgency_score = 100
  elif years_remaining <= 0:
    status = "DUE NOW"     (orange) — at or past end-of-life
    urgency_score = 80
  elif years_remaining <= rule.warning_years_before:
    status = "UPCOMING"    (yellow) — approaching end-of-life
    urgency_score = 60
  else:
    status = "OK"          (green)  — not yet due
    urgency_score = max(0, 40 - (years_remaining * 3))
```

### Subdivision-Level Scoring

For each subdivision, calculate:
- `hvac_pct_due` = % of homes where HVAC status is "CRITICAL" or "DUE NOW"
- Same for roof, water_heater, paint
- `maintenance_urgency_score` = weighted average:
  - HVAC: 30% weight (high cost, high urgency)
  - Roof: 25% weight (highest cost)
  - Water Heater: 20% weight (most common replacement)
  - Paint: 15% weight
  - Other: 10% weight

### API Endpoint

`GET /api/maintenance/forecast/:subdivisionId` returns:
```json
{
  "subdivision": "Bridgetown",
  "total_homes": 140,
  "year_built_mode": 2008,
  "urgency_score": 78,
  "systems": {
    "hvac": {
      "pct_critical": 12,
      "pct_due_now": 35,
      "pct_upcoming": 28,
      "pct_ok": 25,
      "estimated_homes_needing_service": 66,
      "avg_cost_retail": 6000,
      "avg_cost_group": 4200,
      "total_savings_potential": 118800
    },
    "water_heater": { ... },
    "roof": { ... },
    "exterior_paint": { ... }
  },
  "top_recommendation": "HVAC tune-up/replacement — 47% of homes are at or past end-of-life",
  "estimated_total_savings": 287000
}
```

---

## 7. FRONTEND PAGES & COMPONENTS

### Page Structure (React Router)

Use HashRouter for GitHub Pages compatibility.

```
/#/                          → Dashboard
/#/subdivisions              → Subdivision list with search/filter/sort
/#/subdivisions/:id          → Subdivision detail (the key Intel page)
/#/properties                → Property database (searchable table)
/#/properties/:id            → Property detail
/#/contacts                  → CRM contacts list
/#/contacts/:id              → Contact detail with activity history
/#/contacts/new              → Add new contact form
/#/pipeline                  → HOA pipeline board (Kanban-style)
/#/projects                  → Project list
/#/projects/:id              → Project detail with sign-ups
/#/projects/new              → Create new project
/#/contractors               → Contractor list with ratings and services
/#/email/compose             → Email composer
/#/email/templates           → Email template manager
/#/email/sent                → Sent email history
/#/reports/forecast/:subId   → Neighborhood Maintenance Forecast (printable)
/#/import                    → CSV import tool
/#/settings                  → Maintenance rules, general settings
```

### Page Details

#### Dashboard (`/#/`)

The main landing page. At a glance:

**Top Row — Key Metrics (4 cards):**
1. Total Properties in Database (with +X new this week)
2. Active Subdivisions Being Tracked
3. Active Projects (with total homes signed up)
4. Pipeline: X HOAs in active stages

**Second Row — Hot Subdivisions (table, 5 rows, sorted by urgency_score DESC):**
| Subdivision | Homes | Built | Urgency | Top Need | Pipeline Stage |
Shows the subdivisions most urgently needing service. Click to open detail.

**Third Row — Two Charts Side by Side:**
- LEFT: Bar chart — "Homes by Build Year" (shows the wave pattern of construction)
- RIGHT: Pie chart — "Pipeline Stage Distribution" (how many HOAs at each stage)

**Fourth Row — Recent Activity Feed (5 most recent):**
Shows recent CRM activities: emails sent, meetings logged, pitches made, projects updated.

**Fifth Row — Upcoming Tasks / Reminders:**
- HOAs to follow up with (last_contacted > 7 days ago and pipeline_stage in active stages)
- Projects with sign-up deadlines approaching
- Scheduled service dates this week

#### Subdivision Intel (`/#/subdivisions/:id`)

**THIS IS THE MOST IMPORTANT PAGE IN THE APP.** This is your battle plan for each neighborhood.

**Header:**
- Subdivision name (large)
- Location / ZIP
- Pipeline stage badge (color-coded)
- "Generate Forecast Report" button → creates printable PDF
- "Send Pitch Email" button → opens email composer pre-filled

**Info Panel (2-column grid):**
- Total Homes: 140
- Year Built Range: 2007–2009 (Mode: 2008)
- Avg Square Footage: 2,850
- Avg Assessed Value: $475,000
- HOA: Bridgetown HOA
- HOA Contact: John Smith (Board President)
- HOA Email: john@bridgetownhoa.org
- HOA Meeting Schedule: First Tuesday, 7pm
- Monthly Dues: $85
- Last Contacted: March 15, 2026

**Maintenance Forecast Panel (the core visualization):**

For each system (HVAC, Water Heater, Roof, Paint, etc.), show a horizontal stacked bar:
- Red segment: % homes CRITICAL
- Orange segment: % homes DUE NOW
- Yellow segment: % homes UPCOMING
- Green segment: % homes OK

Below each bar, show:
- "X homes need service now"
- "Potential savings: $XX,XXX at group rates"

**Recommendation Engine:**
A prominent box that says something like:
> **TOP OPPORTUNITY: HVAC Tune-Up/Replacement**
> 66 of 140 homes (47%) have HVAC systems at or past end-of-life.
> At group rates, each homeowner saves ~$1,800. Your coordination fee: ~$1,320.
> **[Create Project for This →]**

**HOA Contacts Section:**
List of contacts associated with this subdivision. Add new button.

**Activity Timeline:**
All CRM activities for this subdivision, reverse chronological.

**Active/Past Projects:**
Table of projects linked to this subdivision.

#### Pipeline Board (`/#/pipeline`)

A **Kanban-style board** with columns for each pipeline stage:

| Research | Contacted | Meeting Scheduled | Pitched | Approved | Active | Completed |

Each card shows:
- Subdivision name
- # Homes
- Urgency score (color badge)
- Last contacted date
- Key contact name

Cards are draggable between columns. Dragging updates the pipeline_stage.

#### Email Composer (`/#/email/compose`)

- To: (autocomplete from contacts, or manual entry)
- Subject: (text input)
- Body: (rich text editor — use a simple one like React-Quill or just a textarea with markdown preview)
- Template selector: dropdown to load a template
- Variable replacement: when a template is loaded, auto-fill {{subdivision_name}}, {{contact_first_name}}, {{urgency_score}}, {{top_service_needed}}, {{estimated_savings}}, etc.
- "Preview" button shows rendered email
- "Send" button calls the API which uses Resend
- "Save as Draft" option

**Pre-built Email Templates (seed these):**

1. **hoa_intro_pitch** — Initial outreach to HOA board
   - Subject: "Free Maintenance Forecast for {{subdivision_name}}"
   - Body introduces HomeSync, mentions specific data about their neighborhood, offers free forecast

2. **hoa_follow_up** — Follow-up after no response
   - Subject: "Following up — {{subdivision_name}} Maintenance Forecast"

3. **hoa_meeting_request** — Request to present at board meeting
   - Subject: "Quick presentation for {{subdivision_name}} board?"

4. **homeowner_offer** — Offer sent to homeowners after HOA approves
   - Subject: "Save ${{estimated_savings}} on {{service_name}} — {{subdivision_name}} Group Rate"

5. **contractor_inquiry** — Initial outreach to a contractor
   - Subject: "Group rate inquiry — {{num_homes}} homes in {{subdivision_name}}"

6. **contractor_confirmation** — Confirm project details with contractor
   - Subject: "Confirmed: {{project_name}} — {{num_homes}} homes"

7. **project_completion_summary** — Summary sent to HOA after project completes
   - Subject: "{{subdivision_name}} {{service_name}} Complete — Results & Savings"

#### Neighborhood Maintenance Forecast Report (`/#/reports/forecast/:subId`)

A printable/PDF-exportable report designed to be the SALES TOOL you bring to HOA meetings.

**Page 1:**
- HomeSync logo/name
- "Neighborhood Maintenance Forecast"
- Subdivision name, date prepared
- Executive summary: "Based on public property records, your neighborhood's homes (built in YEAR) are approaching key maintenance milestones..."

**Page 2:**
- System-by-system breakdown with bar charts
- Estimated costs at retail vs. group rate
- Total potential savings for the neighborhood

**Page 3:**
- How HomeSync works (brief explainer)
- What the HOA needs to do (approve → we handle everything)
- Contact information
- "No cost to the HOA. Homeowners pay only if they opt in."

This page should have a "Print" button and a "Download PDF" button (server generates PDF via PDFKit).

---

## 8. BACKEND API ENDPOINTS

### Properties

```
GET    /api/properties                  — List all (paginated, filterable, searchable)
GET    /api/properties/:id              — Get one property with maintenance forecast
POST   /api/properties                  — Create one
PUT    /api/properties/:id              — Update one
DELETE /api/properties/:id              — Delete one
POST   /api/properties/import           — CSV bulk import
GET    /api/properties/search?q=        — Full-text search across address, owner, subdivision
GET    /api/properties/stats            — Aggregate stats (total, by zip, by year built)
```

Query params for GET /api/properties:
- `page` (default 1), `limit` (default 50)
- `subdivision` — filter by subdivision name
- `zip` — filter by ZIP code
- `year_built_min`, `year_built_max` — filter by build year range
- `sort` — field name, `order` — asc/desc
- `search` — text search across address, owner_name, subdivision

### Subdivisions

```
GET    /api/subdivisions                — List all (sortable by urgency_score, name, homes)
GET    /api/subdivisions/:id            — Detail with full maintenance forecast
PUT    /api/subdivisions/:id            — Update (HOA info, pipeline stage, notes)
POST   /api/subdivisions/recalculate    — Re-run aggregation from properties table
GET    /api/subdivisions/:id/properties — All properties in this subdivision
GET    /api/subdivisions/:id/timeline   — Activity timeline for this subdivision
```

### Maintenance

```
GET    /api/maintenance/forecast/:subdivisionId  — Full maintenance forecast for subdivision
GET    /api/maintenance/rules                     — List all maintenance rules
PUT    /api/maintenance/rules/:id                 — Update a rule
POST   /api/maintenance/recalculate-all           — Re-run forecasts for all subdivisions
GET    /api/maintenance/hot-list                  — Top 10 most urgent subdivisions
```

### Contacts

```
GET    /api/contacts                    — List (filterable by type, subdivision, tags)
GET    /api/contacts/:id                — Detail with activity history
POST   /api/contacts                    — Create
PUT    /api/contacts/:id                — Update
DELETE /api/contacts/:id                — Delete (soft delete → status = 'inactive')
GET    /api/contacts/search?q=          — Search by name, email, company
```

### Activities

```
GET    /api/activities                  — List (filterable by contact_id, subdivision_id, type)
POST   /api/activities                  — Log new activity
GET    /api/activities/recent?limit=10  — Most recent activities
```

### Projects

```
GET    /api/projects                    — List (filterable by status, subdivision)
GET    /api/projects/:id                — Detail with sign-ups
POST   /api/projects                    — Create
PUT    /api/projects/:id                — Update
DELETE /api/projects/:id                — Delete
GET    /api/projects/:id/signups        — List sign-ups for this project
POST   /api/projects/:id/signups        — Add a sign-up
PUT    /api/projects/:id/signups/:sid   — Update sign-up status
GET    /api/projects/stats              — Revenue, completion stats
```

### Emails

```
POST   /api/emails/send                 — Send an email via Resend
GET    /api/emails/sent                 — List sent emails (paginated)
GET    /api/emails/templates            — List templates
POST   /api/emails/templates            — Create template
PUT    /api/emails/templates/:id        — Update template
POST   /api/emails/preview              — Render a template with variables (returns HTML)
```

### Reports

```
GET    /api/reports/forecast/:subId/pdf — Generate and download PDF forecast report
GET    /api/reports/dashboard-stats     — All stats needed for the dashboard
```

### Import

```
POST   /api/import/csv                  — Upload and import CSV of properties
POST   /api/import/preview              — Preview CSV mapping before import
```

---

## 9. CRM MODULE

### Contact Management

Each contact has:
- Basic info (name, email, phone, company, title)
- Type classification (hoa_board, contractor, homeowner, other)
- Subdivision association
- Tags (JSON array for flexible categorization)
- Activity history (linked via activities table)
- Last contacted date (auto-updated when activity is logged)
- Notes (free text)

### Pipeline Management

The pipeline tracks HOA relationships through stages:

1. **Research** — You've identified the subdivision, pulled data, but haven't made contact
2. **Contacted** — You've sent the first email or made the first call
3. **Meeting Scheduled** — Board meeting date confirmed
4. **Pitched** — You've presented the Neighborhood Maintenance Forecast
5. **Approved** — HOA board has approved your offer to homeowners
6. **Active** — A project is currently running in this subdivision
7. **Completed** — Project(s) finished, results delivered
8. **Declined** — HOA said no (track reason in notes)

Pipeline stage changes should auto-log an activity.

### Activity Types

- `email_sent` — Sent an email (auto-logged when email is sent)
- `phone_call` — Logged a phone call
- `meeting` — In-person or virtual meeting
- `pitch` — Formal pitch/presentation
- `follow_up` — Follow-up action
- `note` — General note
- `status_change` — Pipeline stage change (auto-logged)
- `project_update` — Project milestone (auto-logged)

---

## 10. EMAIL SYSTEM

### Resend Integration

Use the Resend API (https://resend.com) for sending emails.

**Setup:**
1. Create free Resend account (100 emails/day, 3,000/month)
2. Verify a sending domain OR use Resend's onboarding domain for testing
3. Store API key in `.env` as `RESEND_API_KEY`

**Server-side email sending:**
```javascript
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html, text }) {
  const { data, error } = await resend.emails.send({
    from: 'HomeSync <hello@yourdomain.com>',  // Or use Resend test domain
    to: [to],
    subject,
    html,
    text
  });
  // Log to emails table
  return { data, error };
}
```

### Template Variable System

Templates use `{{variable_name}}` syntax. The frontend sends the template + a context object:

```json
{
  "template_id": 1,
  "to_contact_id": 42,
  "variables": {
    "contact_first_name": "John",
    "subdivision_name": "Bridgetown",
    "total_homes": 140,
    "year_built": 2008,
    "top_service_needed": "HVAC Tune-Up",
    "estimated_savings_per_home": 64,
    "estimated_total_savings": 8960,
    "urgency_score": 78,
    "num_homes_needing_service": 66,
    "your_name": "Your Name",
    "your_phone": "(770) 555-0123",
    "your_email": "hello@homesync.com"
  }
}
```

The server replaces all `{{variables}}` in the template before sending.

---

## 11. REPORTS & EXPORT

### Neighborhood Maintenance Forecast (PDF)

Generated server-side using PDFKit. Endpoint: `GET /api/reports/forecast/:subId/pdf`

The PDF should be professional, branded, and printable. It's your primary sales tool.

Content:
- Cover page with HomeSync branding, subdivision name, date
- Executive summary paragraph
- System-by-system analysis with simple horizontal bar charts (PDFKit can draw these)
- Cost comparison table (retail vs. group rate)
- "How It Works" section
- Contact info / next steps

### CSV Exports

Every data table should have a "Export CSV" button:
- Properties list
- Contacts list
- Project sign-ups
- Sent emails log

---

## 12. GITHUB PAGES DEPLOYMENT

### Setup

1. In `client/vite.config.js`, set `base` to `'/homesync/'` (or your repo name)
2. Use HashRouter in React Router (not BrowserRouter) for GitHub Pages compatibility
3. Add a `deploy` script that builds and pushes to `gh-pages` branch

```json
{
  "scripts": {
    "build": "vite build",
    "deploy": "vite build && gh-pages -d dist"
  }
}
```

### Demo Mode

The frontend should detect if the backend is unreachable and switch to "demo mode":

```javascript
// In an API utility file
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    if (!response.ok) throw new Error('API error');
    return await response.json();
  } catch (error) {
    // If backend is unreachable, use demo data
    console.warn('Backend unavailable, using demo data');
    return getDemoData(endpoint);
  }
}
```

Include a `client/src/demo-data/` folder with realistic sample data for every API endpoint, based on actual Forsyth County subdivisions and realistic property records.

**Demo data should include:**
- 5 subdivisions with 20-30 properties each
- Realistic Cumming, GA addresses
- Realistic build years (2005-2015)
- Sample contacts, projects, and activities
- Pre-calculated maintenance forecasts

---

## 13. FILE & FOLDER STRUCTURE

```
homesync/
├── README.md                            # This spec (abbreviated version)
├── SPEC.md                              # Full specification (this document)
├── package.json                         # Root: workspaces config
├── .env.example                         # Template for environment variables
├── .gitignore
│
├── client/                              # React frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx                     # App entry point
│       ├── App.jsx                      # Router setup
│       ├── api/                         # API client utilities
│       │   ├── client.js                # Fetch wrapper with demo fallback
│       │   └── endpoints.js             # All API endpoint functions
│       ├── store/                       # Zustand stores
│       │   ├── useAppStore.js           # General app state
│       │   └── usePipelineStore.js      # Pipeline drag-and-drop state
│       ├── components/                  # Shared/reusable components
│       │   ├── Layout.jsx               # Main layout with sidebar nav
│       │   ├── Sidebar.jsx              # Navigation sidebar
│       │   ├── DataTable.jsx            # Generic sortable/filterable table
│       │   ├── MetricCard.jsx           # Dashboard stat card
│       │   ├── MaintenanceBar.jsx       # Horizontal stacked bar for system status
│       │   ├── UrgencyBadge.jsx         # Color-coded urgency score badge
│       │   ├── PipelineStageBadge.jsx   # Pipeline stage indicator
│       │   ├── ActivityFeed.jsx         # Recent activity list
│       │   ├── ContactCard.jsx          # Contact summary card
│       │   ├── Modal.jsx                # Reusable modal
│       │   ├── SearchBar.jsx            # Search input with debounce
│       │   ├── CSVImporter.jsx          # CSV upload + column mapping
│       │   └── EmailComposer.jsx        # Email compose form
│       ├── pages/                       # Page components (one per route)
│       │   ├── Dashboard.jsx
│       │   ├── SubdivisionList.jsx
│       │   ├── SubdivisionDetail.jsx    # THE key page
│       │   ├── PropertyList.jsx
│       │   ├── PropertyDetail.jsx
│       │   ├── ContactList.jsx
│       │   ├── ContactDetail.jsx
│       │   ├── ContactForm.jsx
│       │   ├── Pipeline.jsx             # Kanban board
│       │   ├── ProjectList.jsx
│       │   ├── ProjectDetail.jsx
│       │   ├── ProjectForm.jsx
│       │   ├── ContractorList.jsx
│       │   ├── EmailCompose.jsx
│       │   ├── EmailTemplates.jsx
│       │   ├── EmailSent.jsx
│       │   ├── ForecastReport.jsx       # Printable report view
│       │   ├── Import.jsx               # CSV import page
│       │   └── Settings.jsx             # Maintenance rules config
│       ├── demo-data/                   # Sample data for GitHub Pages demo
│       │   ├── properties.json
│       │   ├── subdivisions.json
│       │   ├── contacts.json
│       │   ├── projects.json
│       │   ├── activities.json
│       │   └── maintenance-forecast.json
│       └── styles/
│           └── globals.css              # Tailwind base + custom styles
│
├── server/                              # Express.js backend
│   ├── package.json
│   ├── index.js                         # Express app entry point
│   ├── routes/                          # Route handlers
│   │   ├── properties.js
│   │   ├── subdivisions.js
│   │   ├── maintenance.js
│   │   ├── contacts.js
│   │   ├── activities.js
│   │   ├── projects.js
│   │   ├── emails.js
│   │   ├── reports.js
│   │   └── import.js
│   ├── services/                        # Business logic
│   │   ├── maintenanceEngine.js         # The prediction algorithm
│   │   ├── emailService.js             # Resend integration
│   │   ├── reportGenerator.js          # PDF generation with PDFKit
│   │   ├── csvProcessor.js             # CSV parsing and validation
│   │   └── subdivisionAggregator.js    # Recalculate subdivision stats
│   ├── middleware/
│   │   └── errorHandler.js
│   └── utils/
│       └── helpers.js
│
├── database/
│   ├── migrations/                      # Knex migration files
│   │   ├── 001_create_properties.js
│   │   ├── 002_create_subdivisions.js
│   │   ├── 003_create_contacts.js
│   │   ├── 004_create_activities.js
│   │   ├── 005_create_projects.js
│   │   ├── 006_create_project_signups.js
│   │   ├── 007_create_emails.js
│   │   ├── 008_create_email_templates.js
│   │   └── 009_create_maintenance_rules.js
│   ├── seeds/                           # Seed data
│   │   ├── 001_maintenance_rules.js     # Pre-populate lifecycle rules
│   │   ├── 002_email_templates.js       # Pre-populate email templates
│   │   └── 003_demo_data.js             # Optional demo data for development
│   ├── knexfile.js                      # Knex configuration
│   └── homesync.db                      # SQLite database file (git-ignored)
│
├── scripts/
│   ├── scrape-qpublic.js               # Property data scraper (advanced)
│   ├── scrape-config.json              # Target subdivisions for scraper
│   ├── geocode-properties.js           # Add lat/lng to properties (uses free Nominatim API)
│   └── setup.sh                        # Initial setup script (npm install, migrations, seeds)
│
├── docs/
│   └── SPEC.md                          # This document
│
└── .github/
    └── workflows/
        └── deploy.yml                   # GitHub Actions: build + deploy to Pages
```

---

## 14. IMPLEMENTATION ORDER

Build in this order for fastest path to a working product:

### Phase 1: Foundation (Day 1-2)
1. Initialize monorepo with package.json workspaces
2. Set up Vite + React + Tailwind in `/client`
3. Set up Express + SQLite + Knex in `/server`
4. Run all migrations to create database tables
5. Run seed files to populate maintenance_rules and email_templates
6. Build the Layout component with sidebar navigation
7. Build the basic DataTable component
8. Verify frontend ↔ backend communication (CORS configured)

### Phase 2: Data Layer (Day 2-3)
9. Build the CSV import page and API endpoint
10. Build the properties list page with search/filter/sort
11. Build the property detail page
12. Build the subdivision aggregation service
13. Build the subdivisions list page (sorted by urgency)

### Phase 3: Maintenance Engine (Day 3-4)
14. Implement the maintenance prediction algorithm in `maintenanceEngine.js`
15. Build the subdivision detail page (the KEY page) with maintenance forecast visualization
16. Build the MaintenanceBar component (stacked horizontal bars)
17. Build the recommendation engine (top opportunity per subdivision)
18. Build the Settings page to edit maintenance rules

### Phase 4: CRM (Day 4-5)
19. Build contacts CRUD (list, detail, form)
20. Build activities logging
21. Build the pipeline Kanban board
22. Build activity feed component
23. Wire up "last contacted" auto-updates

### Phase 5: Dashboard (Day 5-6)
24. Build the dashboard with MetricCards, charts, hot list, activity feed
25. Build the pipeline stage distribution chart
26. Build the homes-by-build-year chart

### Phase 6: Email & Communication (Day 6-7)
27. Set up Resend integration
28. Build email template management
29. Build email composer with variable replacement
30. Build sent email history page

### Phase 7: Projects & Reports (Day 7-8)
31. Build project CRUD
32. Build project sign-up management
33. Build the Neighborhood Maintenance Forecast report (HTML printable view)
34. Build PDF generation endpoint

### Phase 8: Polish & Deploy (Day 8-9)
35. Build demo data files for GitHub Pages fallback
36. Configure GitHub Actions for Pages deployment
37. Add the qPublic scraper script (advanced)
38. Add CSV export to all data tables
39. Polish UI, add loading states, error handling
40. Write README with setup instructions

---

## 15. ENVIRONMENT VARIABLES & CONFIGURATION

### `.env.example`

```bash
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_PATH=./database/homesync.db

# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=hello@yourdomain.com
FROM_NAME=HomeSync

# Your Info (used in email templates and reports)
OPERATOR_NAME=Your Name
OPERATOR_EMAIL=you@email.com
OPERATOR_PHONE=(770) 555-0123
BUSINESS_NAME=HomeSync
BUSINESS_TAGLINE=Predictive Neighborhood Maintenance

# Frontend (set in client/.env)
VITE_API_URL=http://localhost:3001/api
```

---

## 16. DESIGN SYSTEM

### Visual Identity

- **Primary Color**: Teal (#0E7C7B) — trust, professionalism, differentiation
- **Secondary**: Deep Navy (#0F3460)
- **Accent**: Warm Amber (#D4A017) — urgency, attention
- **Danger**: Red (#C0392B)
- **Success**: Green (#27AE60)
- **Backgrounds**: Off-white (#F8FAFB), Light Teal tint (#EDF7F7)
- **Text**: Near-black (#1A1A2E), Gray (#666666)

### Typography

- **Headings**: Inter (or system sans-serif stack as fallback)
- **Body**: system-ui, -apple-system, sans-serif
- **Monospace** (for data/numbers): JetBrains Mono or similar

### Component Style Guide

- Cards: white background, subtle shadow (shadow-sm), rounded-lg, p-6
- Tables: alternating row colors (white / light teal tint), sticky header
- Buttons: Primary (teal bg, white text), Secondary (outlined), Danger (red)
- Forms: clean labels above inputs, consistent padding, focus ring in teal
- Badges: small rounded-full pills for status/urgency
- Sidebar: dark navy background, white text, active item highlighted with teal

### Urgency Color Coding (used throughout)

- **CRITICAL** (urgency 80-100): Red background, white text — `bg-red-600 text-white`
- **DUE NOW** (urgency 60-79): Orange — `bg-orange-500 text-white`
- **UPCOMING** (urgency 40-59): Yellow — `bg-yellow-400 text-gray-900`
- **OK** (urgency 0-39): Green — `bg-green-500 text-white`

### Pipeline Stage Colors

- Research: Gray
- Contacted: Blue
- Meeting Scheduled: Indigo
- Pitched: Purple
- Approved: Teal
- Active: Green
- Completed: Dark Green
- Declined: Red

---

## APPENDIX A: DEMO DATA FOR GITHUB PAGES

Create realistic demo data based on actual Forsyth County subdivisions. Use these real subdivision names (from Nextdoor/public records):

1. **Bridgetown** — ~140 homes, built 2007-2009
2. **Castleberry** — ~200 homes, built 2004-2006
3. **Windermere** — ~180 homes, built 2010-2012
4. **Sharon Springs** — ~120 homes, built 2005-2007
5. **Lanier Springs** — ~95 homes, built 2012-2014

For each, generate 20-30 sample property records with realistic Cumming, GA addresses (use real street names from the area: Pilgrim Mill Rd, Bethelview Rd, Keith Bridge Rd, etc.), realistic square footages (2,200-3,800 sqft), realistic assessed values ($350,000-$650,000), and names from a diverse name pool reflecting the area's demographics.

---

## APPENDIX B: qPublic SCRAPER NOTES

The Forsyth County qPublic interface is at:
`https://qpublic.schneidercorp.com/Application.aspx?App=ForsythCountyGA`

It's an ASP.NET Web Forms application. Key observations:
- Search by subdivision name returns paginated results
- Each result links to a detail page with full property info
- The application uses ViewState, which must be maintained between requests
- Results pages may use JavaScript for pagination

**Scraper approach:**
1. Use `node-fetch` or `axios` for HTTP requests
2. Use `cheerio` for HTML parsing
3. First GET the search page to capture __VIEWSTATE, __VIEWSTATEGENERATOR, __EVENTVALIDATION
4. POST the search form with the subdivision name + captured tokens
5. Parse the results table
6. Follow detail links for full property data
7. Handle pagination
8. Rate-limit to 1 request every 2 seconds minimum
9. Log all requests and responses for debugging
10. Store raw HTML in a `scripts/cache/` directory for re-parsing without re-requesting

**Important: respect the terms of service. This is public data but don't overload the server. Consider downloading data manually into CSV first and only building the scraper as a convenience tool later.**

---

## APPENDIX C: KEY FORSYTH COUNTY DATA POINTS FOR CONTEXT

Include these in the app's "about" or help sections:

- ZIP 30041 population: ~76,600
- Median household income: $152,564
- Median home value: $574,300
- Population growth since 2000: +134%
- County demographics: 64% White, 18% Asian, 10% Hispanic, 4% Black
- School district ranking: #3 in Georgia
- Major highway: GA-400 (under $4.6B construction through 2031)
- Primary hospital: Northside Hospital Forsyth (3,000+ employees)
- Economic development entity: Forward Forsyth (forwardforsyth.org)
- Number of HOA communities in the area: estimated 200+
- New homes built 2010-2015 in Forsyth County: 14,043 building permits

---

*This document is the master specification for the HomeSync platform. It should be provided to Claude Code as the primary context for building the application. Every page, every API endpoint, every database table, and every feature is described here. Claude Code should follow the implementation order in Section 14 and build incrementally, testing each phase before moving to the next.*
