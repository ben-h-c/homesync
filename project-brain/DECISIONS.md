# Decision Log

Why we made key technical and design choices. The reasoning matters as much as the code.

---

## D001: SQLite over PostgreSQL
- **Date**: 2026-04-03 (project inception)
- **Context**: Needed a database for a single-server SaaS app targeting small contractor businesses
- **Options**: PostgreSQL, MySQL, SQLite, MongoDB
- **Decision**: SQLite via better-sqlite3
- **Reasoning**: Zero configuration, file-based (simple backup), fast for single-server, Render.com supports persistent disk. Knex.js abstracts the SQL so migration to PostgreSQL is a config change if needed.
- **Consequences**: Single writer at a time (fine for <50 concurrent users). No built-in full-text search. Persistent disk required for deployment.
- **Status**: Active — will need PostgreSQL migration if we exceed ~50 concurrent users

## D002: React + Vite over Next.js
- **Date**: 2026-04-03
- **Context**: Need a frontend framework for a contractor-facing SaaS app
- **Options**: Next.js, Create React App, Vite + React, Remix
- **Decision**: Vite + React (SPA with HashRouter)
- **Reasoning**: Simpler deployment (static files), no SSR needed for this use case, fast dev server, HashRouter enables GitHub Pages demo deployment alongside Render production
- **Consequences**: No SEO for app pages (fine — app is behind auth). Landing page SEO is limited (could add prerender later). HashRouter means URLs have # in them.
- **Status**: Active

## D003: Long-Lived JWT over Refresh Token Rotation
- **Date**: 2026-04-03
- **Context**: Refresh token rotation (revoke old token, issue new) caused session loss due to React StrictMode double-mounting useEffect
- **Options**: Fix StrictMode compatibility, disable StrictMode, use long-lived tokens, use session cookies
- **Decision**: 7-day access tokens stored in localStorage, no rotation
- **Reasoning**: React StrictMode is valuable for catching bugs. Session cookies would require CSRF protection. Long-lived tokens are standard for MVPs and acceptable with proper logout.
- **Consequences**: If a token is stolen, attacker has 7 days of access. Mitigated by: tokens only in localStorage (not cookies, so no CSRF), logout revokes server-side. Should add token blacklisting for production.
- **Status**: Active — revisit when adding sensitive financial operations

## D004: Zustand over Redux/Context
- **Date**: 2026-04-03
- **Context**: Need lightweight state management for auth and portal state
- **Options**: Redux Toolkit, React Context, Zustand, Jotai
- **Decision**: Zustand
- **Reasoning**: Minimal boilerplate, works outside React components (useful in fetchAPI), no Provider wrapper needed, tiny bundle size. Two stores: authStore (user, token, tier) and portalStore (portal token, data).
- **Consequences**: No built-in devtools (can add zustand/devtools). No middleware pattern like Redux. Fine for current scale.
- **Status**: Active

## D005: Tailwind CSS over Component Library
- **Date**: 2026-04-03
- **Context**: Need a styling approach that's fast to iterate and produces consistent UI
- **Options**: Material UI, Chakra UI, shadcn/ui, Tailwind CSS (utility-first)
- **Decision**: Tailwind CSS with custom color palette
- **Reasoning**: No component lock-in, faster iteration than component libraries, smaller bundle, full control over design. Custom colors: primary (#0E7C7B teal), navy (#0F3460), amber, danger, success.
- **Consequences**: More verbose JSX. No pre-built component patterns (built our own card, badge, button patterns). Requires discipline to stay consistent.
- **Status**: Active

## D006: Token-in-URL for Client Portal (not passwords)
- **Date**: 2026-04-03
- **Context**: Homeowner clients need to view project status, approve changes, and pay invoices without creating an account
- **Options**: Email/password accounts, magic link login, OAuth, token-in-URL
- **Decision**: Token-in-URL (48-byte random token, SHA-256 hashed in DB, 90-day expiry)
- **Reasoning**: Lowest friction for homeowners. No password to remember. Contractor sends a link, client clicks it. Mirrors Jobber/HouseCall Pro client portal pattern. Each token scoped to exactly one job.
- **Consequences**: URL in browser history/server logs (mitigated by token length making brute force infeasible). No aggregated "my projects" view for clients with multiple jobs (each gets separate link). Contractor can revoke anytime.
- **Status**: Active

## D007: Subscription Pricing at $49/$149/$299
- **Date**: 2026-04-03
- **Context**: Need competitive pricing for contractor SaaS market
- **Options**: Originally $99/$249/$499. Researched competitors: Jobber ($49/$129/$249), Housecall Pro ($79/$189/$329), ServiceTitan ($350+/tech)
- **Decision**: Starter $49, Professional $149, Business $299
- **Reasoning**: $49 entry matches Jobber, lowers barrier. $149 mid-tier between Jobber Connect and Housecall Essentials. $299 below Housecall MAX. Renamed "Enterprise" to "Business" — less intimidating for contractors.
- **Consequences**: Lower ARPU than original plan. Offset by lower barrier to conversion. Invoice limit on Starter (5/month) creates natural upgrade pressure.
- **Status**: Active

## D008: Lazy Loading for Page Components
- **Date**: 2026-04-03
- **Context**: Bundle was 1,594 KB — too large for spotty cell service on job sites
- **Options**: Manual code splitting, route-based lazy loading, dynamic imports
- **Decision**: React.lazy() for all pages except Login, Register, Landing, ContractorDashboard, NotFound
- **Reasoning**: Critical path (login → dashboard) stays fast. Map, marketing, settings, etc. load on demand. Leaflet (155 KB) only loads when map pages are accessed.
- **Consequences**: Brief loading spinner when navigating to a new page for the first time. Acceptable trade-off for 53% bundle reduction.
- **Status**: Active

## D009: Maintenance Urgency Scoring Algorithm
- **Date**: 2026-04-03
- **Context**: Need to rank subdivisions by how urgently homes need maintenance
- **Options**: Simple age-based, weighted multi-system, ML-based prediction
- **Decision**: Weighted multi-system scoring: HVAC 30%, Roof 25%, Water Heater 20%, Exterior Paint 15%, Other 10%
- **Reasoning**: Weights reflect replacement cost and homeowner urgency. HVAC failures are expensive emergencies (30%). Roofs are high-cost but less urgent (25%). Water heaters are frequent replacements (20%). Paint is cosmetic but visible (15%). Algorithm assesses each system as CRITICAL (100)/DUE_NOW (80)/UPCOMING (60)/OK (0-40) based on age vs. expected lifespan.
- **Consequences**: Scores may overestimate urgency for homes that have already replaced systems (public records don't show renovations). Addressed in UI with "estimated" language.
- **Status**: Active

## D010: Business Model Pivot from Operator Tool to Contractor SaaS
- **Date**: 2026-04-03
- **Context**: Originally built as tool for a single operator to coordinate group maintenance deals with HOAs. Evaluated whether contractor SaaS subscription model is better.
- **Options**: Keep operator model, pivot to contractor SaaS, hybrid
- **Decision**: Pivot to contractor SaaS with hybrid option
- **Reasoning**: SaaS generates revenue from day one (vs. 3-9 month HOA sales cycles). Data is immediately valuable to any contractor. Scales without building new contractor networks per market. Group-deal coordination retained as premium feature.
- **Consequences**: Lost the "group discount" narrative as primary value prop. Replaced with "find leads, manage jobs, grow your business." Original operator features still exist for admin role.
- **Status**: Active

---
When adding decisions: be honest about tradeoffs.
