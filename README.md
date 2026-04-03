# HomeSync

**Predictive Neighborhood Maintenance Platform** — An internal business tool that uses public property records to predict when neighborhoods need maintenance (HVAC, roofing, water heaters, etc.), coordinates group-rate contractor deals, and manages the full sales pipeline from HOA outreach to project completion. Built for Forsyth County, GA (ZIP 30041).

**[Live Demo](https://ben-h-c.github.io/homesync/)** — runs with sample data, no backend required.

## Quick Start

```bash
git clone https://github.com/ben-h-c/homesync.git
cd homesync
cp .env.example .env
bash scripts/setup.sh
```

Then start both servers:

```bash
npm run dev:server   # Express API on localhost:3001
npm run dev:client   # Vite dev server on localhost:5173
```

Open [http://localhost:5173/homesync/](http://localhost:5173/homesync/)

## How to Import Data

1. Navigate to **Import** in the sidebar
2. Upload a CSV file exported from [Forsyth County qPublic](https://qpublic.schneidercorp.com/Application.aspx?App=ForsythCountyGA)
3. HomeSync auto-detects column mappings (Parcel ID, Address, Year Built, etc.)
4. Review the preview, adjust mappings if needed, and click **Import**
5. Subdivision aggregation and maintenance forecasts run automatically

A test CSV with 50 sample properties is included at `scripts/test-data.csv`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 3, React Router v6 (HashRouter) |
| Charts | Recharts |
| Tables | TanStack Table v8 |
| Icons | Lucide React |
| State | Zustand |
| Backend | Express.js, Node.js |
| Database | SQLite via better-sqlite3, Knex.js migrations |
| Email | Resend (optional, works without it) |
| PDF | PDFKit |
| Deployment | GitHub Pages (frontend), local server (backend) |
