import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import TierGate from './components/TierGate';
import useAuthStore from './store/authStore';

// Critical pages — loaded eagerly
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ClientLogin from './pages/ClientLogin';
import ClientProjects from './pages/ClientProjects';
import ContractorDashboard from './pages/ContractorDashboard';
import NotFound from './pages/NotFound';

// Lazy-loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MapView = lazy(() => import('./pages/MapView'));
const Opportunities = lazy(() => import('./pages/Opportunities'));
const LeadsAndMap = lazy(() => import('./pages/LeadsAndMap'));
const SubdivisionList = lazy(() => import('./pages/SubdivisionList'));
const SubdivisionDetail = lazy(() => import('./pages/SubdivisionDetail'));
const PropertyList = lazy(() => import('./pages/PropertyList'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const ContactList = lazy(() => import('./pages/ContactList'));
const ContactDetail = lazy(() => import('./pages/ContactDetail'));
const ContactForm = lazy(() => import('./pages/ContactForm'));
const LeadPipeline = lazy(() => import('./pages/LeadPipeline'));
const Pipeline = lazy(() => import('./pages/Pipeline'));
const JobList = lazy(() => import('./pages/JobList'));
const JobDetail = lazy(() => import('./pages/JobDetail'));
const InvoiceList = lazy(() => import('./pages/InvoiceList'));
const InvoiceForm = lazy(() => import('./pages/InvoiceForm'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const ProjectForm = lazy(() => import('./pages/ProjectForm'));
const ContractorList = lazy(() => import('./pages/ContractorList'));
const EmailCompose = lazy(() => import('./pages/EmailCompose'));
const EmailTemplates = lazy(() => import('./pages/EmailTemplates'));
const EmailSent = lazy(() => import('./pages/EmailSent'));
const Messages = lazy(() => import('./pages/Messages'));
const MarketingHub = lazy(() => import('./pages/MarketingHub'));
const ForecastReport = lazy(() => import('./pages/ForecastReport'));
const ProjectList = lazy(() => import('./pages/ProjectList'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Import = lazy(() => import('./pages/Import'));
const Settings = lazy(() => import('./pages/Settings'));
const PortalLayout = lazy(() => import('./pages/portal/PortalLayout'));
const PortalDashboard = lazy(() => import('./pages/portal/PortalDashboard'));
const PortalInvoices = lazy(() => import('./pages/portal/PortalInvoices'));
const PortalChangeOrders = lazy(() => import('./pages/portal/PortalChangeOrders'));
const PortalMessages = lazy(() => import('./pages/portal/PortalMessages'));

function SmartDashboard() {
  const user = useAuthStore((s) => s.user);
  const viewAsTier = useAuthStore((s) => s.viewAsTier);
  // Show contractor dashboard when viewing as a tier, or when user is a contractor
  if (viewAsTier || user?.role !== 'admin') return <ContractorDashboard />;
  return <Dashboard />;
}

// Smart home route: landing page for visitors, redirect for authenticated users
function HomeRoute() {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to="/dashboard" replace />;
  return <Landing />;
}

// Wrap a page component with tier gating
function Gated({ tier, feature, children }) {
  return <TierGate requiredTier={tier} featureName={feature}>{children}</TierGate>;
}

// Admin-only wrapper — redirects non-admins to home
function AdminOnly({ children }) {
  const user = useAuthStore((s) => s.user);
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-xs text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/pricing" element={<Landing />} />

        {/* Client auth */}
        <Route path="/portal/login" element={<ClientLogin />} />
        <Route path="/portal/projects" element={<ClientProjects />} />

        {/* Client portal — public, token-authenticated */}
        <Route path="/portal/:token" element={<PortalLayout />}>
          <Route index element={<PortalDashboard />} />
          <Route path="invoices" element={<PortalInvoices />} />
          <Route path="changes" element={<PortalChangeOrders />} />
          <Route path="messages" element={<PortalMessages />} />
        </Route>

        {/* Home: landing for visitors, dashboard for logged-in users */}
        <Route path="/" element={<HomeRoute />} />

        {/* Protected routes */}
        <Route element={<AuthGuard />}>
          <Route element={<Layout />}>
            {/* Dashboard */}
            <Route path="/dashboard" element={<SmartDashboard />} />

            {/* All tiers */}
            <Route path="/opportunities" element={<LeadsAndMap />} />
            <Route path="/map" element={<LeadsAndMap />} />
            <Route path="/subdivisions" element={<SubdivisionList />} />
            <Route path="/subdivisions/:id" element={<SubdivisionDetail />} />
            <Route path="/leads" element={<LeadPipeline />} />
            <Route path="/jobs" element={<JobList />} />
            <Route path="/jobs/new" element={<ProjectForm />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/jobs/:id/edit" element={<ProjectForm />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/new" element={<InvoiceForm />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
            <Route path="/settings" element={<Settings />} />

            {/* Pro+ gated */}
            <Route path="/proposals" element={<Gated tier="pro" feature="Proposals"><Opportunities /></Gated>} />
            <Route path="/contacts" element={<Gated tier="pro" feature="Contacts CRM"><ContactList /></Gated>} />
            <Route path="/contacts/new" element={<Gated tier="pro" feature="Contacts CRM"><ContactForm /></Gated>} />
            <Route path="/contacts/:id" element={<Gated tier="pro" feature="Contacts CRM"><ContactDetail /></Gated>} />
            <Route path="/email/compose" element={<Gated tier="pro" feature="Email Outreach"><MarketingHub /></Gated>} />
            <Route path="/marketing" element={<Gated tier="pro" feature="Marketing"><MarketingHub /></Gated>} />
            <Route path="/email/templates" element={<Gated tier="pro" feature="Email Outreach"><EmailTemplates /></Gated>} />
            <Route path="/email/sent" element={<Gated tier="pro" feature="Email Outreach"><EmailSent /></Gated>} />
            <Route path="/import" element={<Gated tier="pro" feature="Data Import"><Import /></Gated>} />

            {/* Admin-only pages — redirect non-admins to home */}
            <Route path="/properties" element={<AdminOnly><PropertyList /></AdminOnly>} />
            <Route path="/properties/:id" element={<AdminOnly><PropertyDetail /></AdminOnly>} />
            <Route path="/pipeline" element={<AdminOnly><Pipeline /></AdminOnly>} />
            <Route path="/projects" element={<AdminOnly><ProjectList /></AdminOnly>} />
            <Route path="/projects/new" element={<AdminOnly><ProjectForm /></AdminOnly>} />
            <Route path="/projects/:id" element={<AdminOnly><ProjectDetail /></AdminOnly>} />
            <Route path="/contractors" element={<AdminOnly><ContractorList /></AdminOnly>} />
            <Route path="/reports/forecast" element={<AdminOnly><ForecastReport /></AdminOnly>} />
            <Route path="/reports/forecast/:subId" element={<AdminOnly><ForecastReport /></AdminOnly>} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
      </Suspense>
    </HashRouter>
  );
}
