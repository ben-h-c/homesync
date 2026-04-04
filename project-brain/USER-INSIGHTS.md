# User Insights & Feedback

What we know about our users, gathered from feedback, observation, and research.

## User Personas

### The Solo Operator
- Runs their own business, does the work themselves
- Manages everything from their phone
- Values: speed, simplicity, looking professional to clients
- Pain points: paperwork, finding new neighborhoods, inconsistent income
- Tier fit: Starter ($49/mo) — needs lead discovery + basic invoicing
- Key features: Map, quick invoice creation, mobile-friendly dashboard

### The Growing Crew
- 3-8 person operation, owner manages while crew works
- Needs: delegation, pipeline visibility, team coordination
- Values: efficiency, scaling without chaos
- Pain points: tracking multiple jobs, invoicing delays, marketing time
- Tier fit: Professional ($149/mo) — needs full pipeline + client portal + campaigns
- Key features: Pipeline kanban, project management, email campaigns, team invites

### The Established Company
- 10+ employees, office staff
- Needs: reporting, multi-user access, branded client experience
- Values: professionalism, data, process
- Pain points: software that doesn't integrate, manual data entry
- Tier fit: Business ($299/mo) — needs API, custom branding, unlimited users
- Key features: Data export, API access, white-label portal

## User Workflow Observations

### How Contractors Find Work Today
1. Word of mouth / referrals (primary)
2. Yard signs in neighborhoods they've worked
3. Google Ads / thumbtack / Angi leads (expensive, competitive)
4. Driving neighborhoods and knocking doors
5. HOA board relationships (rare but high value)

### What Makes HomeSync Different
- Data-driven: "Here are 200 homes in Creekstone Estates with 20-year-old roofs" vs "I hope someone calls"
- Proactive: Contractor reaches out to neighborhoods BEFORE homeowners start calling competitors
- Organized: One place for leads → projects → invoices → client communication

### Mobile Usage Patterns
- Contractors check the app in the truck between jobs (quick glances)
- Create invoices on-site right after completing work
- Check pipeline at the start of each day
- Client portal is viewed on homeowner's phones (even smaller screens)
- Touch targets must be large — gloves, dirty hands, bright sunlight

## Feature Adoption Insights (Inferred)

### Most Valuable (Core Workflow)
1. Interactive map + lead discovery — the primary differentiator
2. Pipeline tracking — "Where is everything at a glance"
3. Invoicing — "Get paid faster"

### High Value but Requires Adoption
4. Client portal — contractors love the idea but clients need to be trained
5. Email campaigns — powerful but contractors are reluctant marketers
6. Marketing plan generator — needs hand-holding, step-by-step guidance

### Least Used (but important for retention)
7. Settings / team management — set once, rarely revisit
8. Data export — occasional need
9. Maintenance rules engine — admin-only, rarely modified

## UX Observations

### What Works
- Pipeline kanban with drag-and-drop is intuitive
- Invoice PDF generation feels "professional" — contractors are impressed
- Map color-coding is immediately understandable (red = urgent)
- "Add to Pipeline" from map is a natural workflow

### What Needs Improvement
- Empty states on new accounts are discouraging (empty dashboard, empty pipeline)
- Marketing plan generator output could be more actionable (less text, more checkboxes)
- Onboarding is non-existent — new users land on empty dashboard
- Mobile table layouts need work — some tables don't collapse to cards

## Feature Requests from Users

(Populated from session feedback)
- "Can I upload photos of the job?" — P2, photos field exists but no upload UI
- "How do I get back to the homepage?" — Fixed: added "Back to homepage" link on login
- "The Properties tab — what would a contractor use it for?" — Hidden from contractor nav, admin-only now
- "The tier views should look different" — Fixed: View As tier switcher shows real differences
- "Contractor emails look made up" — Fixed: cleared unverified, researched real emails
- "Is the map up to date?" — Fixed: moved coordinates from hardcoded to database, added to all 144 subs

## UX Audit Findings (2026-04-03 Improvement Cycle)

### Critical UX Gaps
- No onboarding flow: new users land on empty dashboard with no guidance
- No toast/notification system: errors show as `alert()`, successes are inconsistent
- Forms lack inline validation: errors only shown after submit attempt
- Portal pages return null instead of loading spinner when data is loading

### Mobile Concerns
- Pipeline kanban requires horizontal scroll — works but not ideal on phones
- Invoice form has fixed-width columns that compress poorly
- Tables don't collapse to card layout on mobile despite CSS class being available
- Map filter toolbar wraps awkwardly on small screens

### Accessibility Gaps
- Form inputs missing htmlFor/label associations in multiple pages
- No aria-label on icon-only buttons (download, delete, close)
- Heading hierarchy inconsistent (some pages skip h2 → h4)
- Modal focus not trapped — keyboard users can tab behind open modals
- Color contrast on some gray text may not meet WCAG AA on light backgrounds
