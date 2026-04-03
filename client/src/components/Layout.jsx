import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { isDemoMode, onDemoModeChange } from '../api/client';
import { X } from 'lucide-react';

export default function Layout() {
  const [demo, setDemo] = useState(isDemoMode());
  const [dismissed, setDismissed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => onDemoModeChange(setDemo), []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Demo banner */}
        {demo && !dismissed && (
          <div className="bg-amber/90 text-white text-sm px-4 py-2 flex items-center justify-between shrink-0">
            <span>Demo Mode — sample data shown. Run the server locally for full functionality.</span>
            <button onClick={() => setDismissed(true)}><X size={16} /></button>
          </div>
        )}

        {/* Mobile header */}
        <div className="md:hidden bg-navy text-white px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <span className="font-bold"><span className="text-primary">Home</span>Sync</span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-off-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
