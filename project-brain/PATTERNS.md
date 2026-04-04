# Coding Patterns & Conventions

Established patterns in this codebase. Follow these for consistency.

## Naming Conventions

### Files
- React pages: `PascalCase.jsx` (e.g., `ContractorDashboard.jsx`, `InvoiceForm.jsx`)
- React components: `PascalCase.jsx` in `/components/`
- Server routes: `kebab-case.js` (e.g., `contractor-jobs.js`, `client-portal.js`)
- Server services: `camelCase.js` (e.g., `maintenanceEngine.js`, `emailService.js`)
- Database migrations: `NNN_description.js` (e.g., `018_enhance_projects.js`)
- Zustand stores: `camelCaseStore.js` (e.g., `authStore.js`, `portalStore.js`)

### Database
- Tables: `snake_case` plural (e.g., `contractor_jobs`, `invoice_line_items`)
- Columns: `snake_case` (e.g., `client_email`, `estimated_cost`, `created_at`)
- Foreign keys: `referenced_table_id` singular (e.g., `user_id`, `job_id`, `subdivision_id`)
- Timestamps: always `created_at` and `updated_at`
- Status fields: text with documented enum values in comments

### API
- Routes: `/api/resource` (plural nouns, kebab-case)
- Actions: `POST /api/resource/:id/verb` (e.g., `/invoices/:id/mark-paid`, `/jobs/:id/portal/enable`)
- Query params: `snake_case` (e.g., `?service_type=hvac&year_min=1990`)
- Response: JSON, always includes error field on failure `{ error: "message" }`

### Frontend
- Page components export default function
- Hooks: `use` prefix (standard React convention)
- Event handlers: `handleVerb` (e.g., `handleSave`, `handleDrop`, `handleSearch`)
- State setters: `set` prefix matching state name (e.g., `[form, setForm]`, `[loading, setLoading]`)

## Component Patterns

### Page Structure
Every page follows this pattern:
```jsx
export default function PageName() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  if (loading) return <LoadingState />;

  return (
    <div>
      <Header /> {/* h1 + action buttons */}
      <Filters /> {/* optional filter bar */}
      <Content /> {/* main content: table, cards, form */}
    </div>
  );
}
```

### Card Pattern
```jsx
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Section Title</h2>
  {/* content */}
</div>
```

### Status Badge Pattern
```jsx
const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-500',
};
<span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status]}`}>
  {status.replace(/_/g, ' ')}
</span>
```

### Tier-Aware Components
```jsx
const user = useAuthStore((s) => s.user);
const viewAsTier = useAuthStore((s) => s.viewAsTier);
const effectiveTier = viewAsTier || (user?.role === 'admin' ? 'enterprise' : (user?.subscription_tier || 'starter'));
const isStarter = effectiveTier === 'starter';
// Use effectiveTier for ALL tier checks — this makes the "View As" admin feature reactive
```

## Data Fetching Patterns

### Standard API Call
```jsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchAPI('/endpoint')
    .then(setData)
    .catch(() => setData([]))
    .finally(() => setLoading(false));
}, []);
```

### Parallel Fetching
```jsx
const [leads, setLeads] = useState([]);
const [projects, setProjects] = useState([]);

useEffect(() => {
  Promise.all([
    fetchAPI('/leads').catch(() => []),
    fetchAPI('/jobs').catch(() => []),
  ]).then(([l, p]) => { setLeads(l); setProjects(p); });
}, []);
```

### Authenticated Downloads (PDFs)
```jsx
const downloadPdf = async (id, filename) => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${API}/invoices/${id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};
```

## State Management

### Auth Store (authStore.js)
- User and token stored in both Zustand and localStorage
- On page load, Zustand initializes from localStorage (synchronous — no async refresh needed)
- `viewAsTier` allows admins to preview the app as any subscription tier
- `hasTier(required)` checks effective tier including viewAsTier override

### Portal Store (portalStore.js)
- Separate from auth — portal uses token-in-URL, not JWT
- `portalFetch(path)` helper appends token to URL path
- Data loaded once on mount, cached in store

## Error Handling

### Backend
```javascript
router.get('/:id', async (req, res) => {
  try {
    const item = await db('table').where('id', req.params.id).first();
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Frontend
- `fetchAPI` catches network errors and falls back to demo data
- Individual pages use `.catch(() => setData([]))` for graceful degradation
- Forms show error in state: `const [error, setError] = useState('')`
- Success shows toast/banner: brief green message that auto-dismisses

## Anti-Patterns — Things We Learned NOT to Do

### DON'T: Use refresh token rotation with React StrictMode
- StrictMode double-mounts useEffect in dev mode
- If the first mount revokes the token and the second mount tries to use it, the session is destroyed
- Solution: Use long-lived access tokens or deduplicate refresh calls

### DON'T: Use dynamic `await import()` in the hot path of fetchAPI
- Creates a separate module instance from static imports
- Causes Zustand store duplication — changes in one aren't reflected in the other
- Solution: Read directly from localStorage in fetchAPI

### DON'T: Use `hasTier` from authStore as a Zustand selector for reactivity
- `hasTier` is a function, not a value — Zustand won't re-render when it changes
- Solution: Subscribe to `viewAsTier` and `user` directly, compute tier check inline

### DON'T: Use window.open for authenticated downloads
- Bearer token can't be attached to window.open requests
- Solution: Use fetch + blob + createObjectURL for authenticated file downloads

### DON'T: Use `overflow-hidden` on hero sections with background gradients
- Content renders but screenshots/tools can't capture it (appears blank)
- Background gradients that are too subtle can make content invisible in screenshots

### DON'T: Store generated/fake email addresses in production data
- Seed data had `info@companyname.com` patterns that looked real but weren't
- Solution: Only store verified emails from research; set unverified to null

### DON'T: Pass req.body directly to database insert/update
- Allows insertion of arbitrary columns, including user_id overrides
- Solution: Always whitelist allowed fields: `const { title, status } = req.body;`
- Or use a validation library (Zod, express-validator)

### DON'T: Skip ownership checks on sub-resource routes
- `/jobs/:id/change-orders` initially had no check that the job belonged to the user
- ANY authenticated user could read change orders for ANY job
- Solution: Always verify `WHERE user_id = req.user.id` before accessing sub-resources

### DON'T: Reuse variable names in different scopes of the same function
- `const campaign = ...` used twice in campaigns.js caused SyntaxError
- Solution: Use descriptive names for ownership checks (e.g., `ownedCampaign`)

### DON'T: Use alert() for error feedback
- Blocks the UI thread, looks unprofessional, no way to style or auto-dismiss
- Solution: Use a toast library (react-hot-toast, sonner) for all notifications
