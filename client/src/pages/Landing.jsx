import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Map, GitBranch, Receipt, Mail, BarChart3, ArrowRight, Menu, X,
  Check, Star, Briefcase, Target, Zap, Shield, ChevronRight, Users,
} from 'lucide-react';

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ─── HEADER ─── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-sm' : 'bg-white/80 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold"><span className="text-[#0F3460]">WeDone</span><span className="text-[#0E7C7B]">DoIt</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('features')} className="text-sm font-medium text-gray-600 hover:text-gray-900">Features</button>
            <button onClick={() => scrollTo('pricing')} className="text-sm font-medium text-gray-600 hover:text-gray-900">Pricing</button>
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Login</Link>
            <Link to="/register" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0E7C7B] text-white text-sm font-semibold rounded-lg hover:bg-[#0E7C7B]/90 shadow-sm">
              Start Free Trial
            </Link>
          </nav>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-gray-600">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            <button onClick={() => scrollTo('features')} className="block w-full text-left text-sm font-medium text-gray-700 py-2">Features</button>
            <button onClick={() => scrollTo('pricing')} className="block w-full text-left text-sm font-medium text-gray-700 py-2">Pricing</button>
            <Link to="/login" className="block text-sm font-medium text-gray-700 py-2">Login</Link>
            <Link to="/register" className="block w-full text-center px-5 py-2.5 bg-[#0E7C7B] text-white text-sm font-semibold rounded-lg">Start Free Trial</Link>
          </div>
        )}
      </header>

      {/* ─── HERO ─── */}
      <section className="relative pt-28 pb-8 md:pt-32 md:pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F8F9FA] via-white to-[#EDF7F7]" />

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating gradient blobs */}
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#0E7C7B]/[0.08] rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]" />
          <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-[#0F3460]/[0.06] rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]" />
          <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-[#0E7C7B]/[0.07] rounded-full blur-3xl animate-[float_18s_ease-in-out_infinite_2s]" />

          {/* Floating grid of subtle icons */}
          {[
            { Icon: MapPin, x: '8%', y: '15%', delay: '0s', dur: '22s', size: 28, opacity: 0.12 },
            { Icon: Briefcase, x: '85%', y: '10%', delay: '3s', dur: '20s', size: 32, opacity: 0.10 },
            { Icon: Receipt, x: '75%', y: '65%', delay: '1s', dur: '24s', size: 26, opacity: 0.10 },
            { Icon: Map, x: '12%', y: '70%', delay: '5s', dur: '19s', size: 30, opacity: 0.12 },
            { Icon: GitBranch, x: '50%', y: '8%', delay: '2s', dur: '21s', size: 24, opacity: 0.08 },
            { Icon: BarChart3, x: '92%', y: '40%', delay: '4s', dur: '23s', size: 28, opacity: 0.10 },
            { Icon: Shield, x: '30%', y: '80%', delay: '6s', dur: '18s', size: 22, opacity: 0.08 },
            { Icon: Target, x: '65%', y: '25%', delay: '1.5s', dur: '26s', size: 20, opacity: 0.08 },
            { Icon: Zap, x: '20%', y: '45%', delay: '3.5s', dur: '17s', size: 24, opacity: 0.10 },
            { Icon: Mail, x: '42%', y: '75%', delay: '7s', dur: '22s', size: 26, opacity: 0.08 },
          ].map(({ Icon, x, y, delay, dur, size, opacity }, i) => (
            <div key={i} className="absolute" style={{
              left: x, top: y,
              animation: `floatIcon ${dur} ease-in-out ${delay} infinite`,
              opacity,
            }}>
              <Icon size={size} className="text-[#0F3460]" strokeWidth={1.5} />
            </div>
          ))}

          {/* Subtle grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#0F3460" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0E7C7B]/10 text-[#0E7C7B] rounded-full text-sm font-medium mb-6">
              <Zap size={14} /> Built for home service contractors
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F3460] leading-tight">
              The all-in-one platform to find leads, win jobs, and run your business
            </h1>
            <p className="mt-5 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              WeDoneDoIt gives contractors the data, tools, and workflows to find opportunities, manage projects, send invoices, and grow — all from one dashboard.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#0E7C7B] text-white font-semibold rounded-lg hover:bg-[#0E7C7B]/90 shadow-lg shadow-[#0E7C7B]/20 text-base">
                Start Free Trial <ArrowRight size={18} />
              </Link>
              <button onClick={() => scrollTo('features')} className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-[#0F3460] text-[#0F3460] font-semibold rounded-lg hover:bg-[#0F3460]/5 text-base">
                See Features
              </button>
            </div>
          </div>

          {/* Real Dashboard Screenshot */}
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 hover:scale-125 hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)] hover:z-10 relative cursor-pointer">
              <img src="/screenshots/dashboard.png" alt="WeDoneDoIt contractor dashboard showing active projects, leads, revenue, and pipeline"
                className="w-full" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUSTED BY ─── */}
      <section className="py-8 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Powering contractors across the country</p>
          <div className="flex items-center justify-center gap-8 flex-wrap text-gray-400 text-sm font-medium">
            <span>Thousands of Subdivisions</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>Public Property Data</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>Maintenance Intelligence</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>Growing Nationwide</span>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F3460]">Everything you need to grow your business</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">From finding leads to getting paid, WeDoneDoIt handles the entire contractor workflow.</p>
          </div>

          {/* Feature 1: Leads & Map */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium mb-4">
                <MapPin size={12} /> Lead Discovery
              </div>
              <h3 className="text-2xl font-bold text-[#0F3460] mb-4">Find opportunities before your competition</h3>
              <p className="text-gray-600 mb-4">Our interactive map shows subdivisions in your service area, color-coded by maintenance urgency. Filter by trade, ZIP code, and home age to find neighborhoods that need your services right now.</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><Check size={16} className="text-[#0E7C7B] shrink-0" /> See which neighborhoods have aging roofs, HVAC systems, or paint</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-[#0E7C7B] shrink-0" /> Filter by your trade specialty to see relevant opportunities</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-[#0E7C7B] shrink-0" /> Add subdivisions to your pipeline with one click</li>
              </ul>
            </div>
            <div className="rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:scale-125 hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)] hover:z-10 relative cursor-pointer">
              <img src="/screenshots/leads-map.png" alt="Interactive map showing subdivision opportunities in your area"
                className="w-full" loading="lazy" />
            </div>
          </div>

          {/* Feature 2: Pipeline */}
        </div>
      </section>
      <section className="py-16 md:py-20 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium mb-4">
                <GitBranch size={12} /> Pipeline Management
              </div>
              <h3 className="text-2xl font-bold text-[#0F3460] mb-4">Track every deal from lead to completion</h3>
              <p className="text-gray-600 mb-4">Drag-and-drop kanban board shows your entire pipeline at a glance. See leads, quotes, active projects, and completed work — all in one view with real-time value tracking.</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><Check size={16} className="text-[#0E7C7B] shrink-0" /> 8-stage pipeline: New → Contacted → Quoted → Won → Completed</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-[#0E7C7B] shrink-0" /> Pipeline value and conversion rate at the top</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-[#0E7C7B] shrink-0" /> Click any card for details, quick actions, and notes</li>
              </ul>
            </div>
            <div className="md:order-1 rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:scale-125 hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)] hover:z-10 relative cursor-pointer">
              <img src="/screenshots/pipeline.png" alt="Kanban pipeline tracking leads through stages"
                className="w-full" loading="lazy" />
            </div>
          </div>

          {/* Feature 3: Projects */}
        </div>
      </section>
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium mb-4">
                <Briefcase size={12} /> Project Management
              </div>
              <h3 className="text-2xl font-bold text-[#0F3460] mb-4">Manage jobs with change orders and client portal</h3>
              <p className="text-gray-600 mb-4">Full project tracking with client info, scope of work, timeline, change orders, and activity history. Invite clients to a branded portal where they can approve changes and view progress.</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><Check size={16} className="text-[#0E7C7B] shrink-0" /> Create projects from leads — client info carries forward</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-[#0E7C7B] shrink-0" /> Change orders with client approval built in</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-[#0E7C7B] shrink-0" /> Client portal with messaging, invoices, and status updates</li>
              </ul>
            </div>
            <div className="rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:scale-125 hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)] hover:z-10 relative cursor-pointer">
              <img src="/screenshots/subdivision.png" alt="Project detail view with maintenance data and forecasts"
                className="w-full" loading="lazy" />
            </div>
          </div>

          {/* Feature 4: Invoicing */}
        </div>
      </section>
      <section className="py-16 md:py-20 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium mb-4">
                <Receipt size={12} /> Professional Invoicing
              </div>
              <h3 className="text-2xl font-bold text-[#0F3460] mb-4">Get paid faster with professional invoices</h3>
              <p className="text-gray-600 mb-4">Create branded invoices with line items, discounts, tax calculation, and PDF generation. Track status from draft through paid. Send directly to clients from the platform.</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><Check size={16} className="text-[#0E7C7B] shrink-0" /> Auto-populated from project details</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-[#0E7C7B] shrink-0" /> PDF generation and email delivery</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-[#0E7C7B] shrink-0" /> Revenue tracking and payment status history</li>
              </ul>
            </div>
            <div className="md:order-1 rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:scale-125 hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)] hover:z-10 relative cursor-pointer">
              <img src="/screenshots/invoice-detail.png" alt="Professional invoice with line items and payment tracking"
                className="w-full" loading="lazy" />
            </div>
          </div>

          {/* Feature 5: Marketing */}
        </div>
      </section>
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium mb-4">
                <Mail size={12} /> Marketing & Outreach
              </div>
              <h3 className="text-2xl font-bold text-[#0F3460] mb-4">Reach the right neighborhoods at the right time</h3>
              <p className="text-gray-600 mb-4">12 pre-built email templates, campaign builder for bulk outreach, and a marketing plan generator that recommends target subdivisions based on your trade and area.</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><Check size={16} className="text-[#0E7C7B] shrink-0" /> Email templates for cold outreach, follow-ups, and referrals</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-[#0E7C7B] shrink-0" /> Campaign builder to reach multiple leads at once</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-[#0E7C7B] shrink-0" /> Quarterly marketing plan generator with actionable checklist</li>
              </ul>
            </div>
            <div className="rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:scale-125 hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)] hover:z-10 relative cursor-pointer">
              <img src="/screenshots/marketing.png" alt="Marketing hub with email templates and campaign builder"
                className="w-full" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURE GRID ─── */}
      <section className="py-16 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#0F3460] text-center mb-12">Plus everything else you need</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Map, title: 'Interactive Map', desc: 'Subdivisions in your service area, color-coded by urgency with click-to-explore popups.' },
              { icon: Target, title: 'Subdivision Intelligence', desc: 'Home age, value, urgency scores, HOA contacts, and maintenance forecasts for every neighborhood.' },
              { icon: Users, title: 'Client Portal', desc: 'Branded portal for clients to view projects, approve changes, pay invoices, and message you.' },
              { icon: BarChart3, title: 'Revenue Dashboard', desc: 'Track monthly revenue, outstanding invoices, pipeline value, and conversion rates at a glance.' },
              { icon: Shield, title: 'Team Management', desc: 'Invite team members with Admin, Manager, or Technician roles. Everyone sees what they need.' },
              { icon: Zap, title: 'Data Export', desc: 'Export projects, invoices, leads, and clients as CSV anytime. Your data is always yours.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="p-2.5 bg-[#0E7C7B]/10 rounded-lg w-fit mb-4"><f.icon size={20} className="text-[#0E7C7B]" /></div>
                <h3 className="font-bold text-[#0F3460] mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#0F3460] text-center mb-4">How it works</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">Three steps to more leads and better-managed projects</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Find Opportunities', desc: 'Browse the interactive map or list view. Filter by your trade, area, and home age. See exactly which neighborhoods need your services.' },
              { step: '2', title: 'Win the Work', desc: 'Add leads to your pipeline. Send data-driven proposals showing maintenance needs. Track every conversation through to close.' },
              { step: '3', title: 'Manage & Get Paid', desc: 'Create projects, track progress, handle change orders, and send professional invoices — all from one place.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#0E7C7B] text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">{s.step}</div>
                <h3 className="text-lg font-bold text-[#0F3460] mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-16 md:py-24 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F3460]">Simple, transparent pricing</h2>
            <p className="mt-3 text-gray-500">Start free for 14 days. No credit card required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Starter', price: '$49', features: ['Interactive map access', 'Up to 25 subdivision views/month', 'Basic lead pipeline', 'Invoice creation (5/month)', '1 user', 'Email support'] },
              { name: 'Professional', price: '$149', popular: true, features: ['Unlimited subdivision views', 'Full pipeline with drag-and-drop', 'Unlimited invoices + PDF export', 'Email campaigns & templates', 'Client portal with messaging', 'Contact database access', 'Marketing plan generator', 'Up to 5 users', 'Priority support'] },
              { name: 'Business', price: '$299', features: ['Everything in Professional', 'Multi-market access', 'API access for integrations', 'Unlimited team members', 'Custom branding & white-label', 'Advanced analytics & reporting', 'Dedicated account manager', 'Onboarding assistance'] },
            ].map((tier) => (
              <div key={tier.name} className={`bg-white rounded-2xl p-8 ${tier.popular ? 'border-2 border-[#0E7C7B] shadow-xl relative' : 'border border-gray-200'}`}>
                {tier.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0E7C7B] text-white text-xs font-bold px-4 py-1.5 rounded-full">Most Popular</div>}
                <h3 className="text-lg font-bold text-[#0F3460]">{tier.name}</h3>
                <div className="mt-3 mb-6"><span className="text-4xl font-extrabold text-[#0F3460]">{tier.price}</span><span className="text-gray-500">/mo</span></div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600"><Check size={16} className="text-[#0E7C7B] mt-0.5 shrink-0" />{f}</li>
                  ))}
                </ul>
                <Link to="/register"
                  className={`block text-center py-3 rounded-lg text-sm font-semibold ${tier.popular ? 'bg-[#0E7C7B] text-white hover:bg-[#0E7C7B]/90' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {tier.name === 'Business' ? 'Contact Sales' : 'Start Free Trial'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#0F3460] text-center mb-12">Trusted by contractors everywhere</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { quote: 'WeDoneDoIt changed how we find work. Instead of cold-calling, we know exactly which neighborhoods need our services. We landed 3 new projects in the first month.', name: 'Marcus Thompson', co: 'Thompson Roofing', city: 'Georgia' },
              { quote: 'The invoicing and client portal save me hours every week. Clients love being able to see their project status and approve changes right from their phone.', name: 'Sarah Chen', co: 'Chen HVAC Services', city: 'Texas' },
              { quote: 'The pipeline view is a game-changer. I can see every lead, every quote, and every active job in one place. Nothing falls through the cracks anymore.', name: 'David Rodriguez', co: 'Rodriguez Painting', city: 'Florida' },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="flex gap-1 mb-4">{[...Array(5)].map((_, i) => <Star key={i} size={16} className="text-amber-400 fill-amber-400" />)}</div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-sm text-[#0F3460]">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.co} &middot; {t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 md:py-20 bg-[#0F3460]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to grow your contracting business?</h2>
          <p className="text-lg text-white/70 mb-8">Join thousands of contractors growing their business with WeDoneDoIt. Start your 14-day free trial today.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0E7C7B] text-white font-semibold rounded-lg hover:bg-[#0E7C7B]/90 text-lg shadow-lg">
            Start Free Trial <ArrowRight size={20} />
          </Link>
          <p className="text-sm text-white/50 mt-4">No credit card required &middot; 14-day free trial &middot; Cancel anytime</p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#0A1628] text-white/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollTo('features')} className="hover:text-white">Features</button></li>
                <li><button onClick={() => scrollTo('pricing')} className="hover:text-white">Pricing</button></li>
                <li><span className="hover:text-white">Map</span></li>
                <li><span className="hover:text-white">Integrations</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Company</h4>
              <ul className="space-y-2 text-sm"><li>About</li><li>Blog</li><li>Careers</li><li>Contact</li></ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm"><li>Terms of Service</li><li>Privacy Policy</li><li>Cookie Policy</li></ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Support</h4>
              <ul className="space-y-2 text-sm"><li>Help Center</li><li>Documentation</li><li>API Reference</li><li>Status</li></ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-xs">
            <p>&copy; 2026 WeDoneDoIt. Smart tools for contractors who mean business.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
