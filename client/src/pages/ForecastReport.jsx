import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, Download } from 'lucide-react';
import { fetchAPI } from '../api/client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function ForecastReport() {
  const { subId } = useParams();
  const [sub, setSub] = useState(null);
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    if (!subId) return;
    fetchAPI(`/subdivisions/${subId}`).then(setSub).catch(() => {});
    fetchAPI(`/maintenance/forecast/${subId}`).then(setForecast).catch(() => {});
  }, [subId]);

  if (!subId) return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Forecast Reports</h1>
      <p className="text-gray-500">Select a subdivision from the Subdivisions page to generate a forecast report.</p>
    </div>
  );

  if (!sub || !forecast) return <div className="text-gray-500">Loading report...</div>;

  const mainSystems = Object.entries(forecast.systems)
    .filter(([, s]) => !s.is_recurring)
    .sort((a, b) => b[1].estimated_homes_needing_service - a[1].estimated_homes_needing_service);

  return (
    <div>
      {/* Print controls — hidden when printing */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-2xl font-bold">Forecast Report</h1>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Printer size={16} /> Print
          </button>
          <a href={`${API_BASE}/reports/forecast/${subId}/pdf`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
            <Download size={16} /> Download PDF
          </a>
        </div>
      </div>

      {/* Report content */}
      <div className="bg-white rounded-lg shadow-sm print:shadow-none print:rounded-none">
        {/* Page 1: Cover */}
        <div className="p-10 text-center border-b border-gray-200 print:border-0 print:break-after-page">
          <div className="text-primary font-bold text-xl">HomeSync</div>
          <div className="text-gray-500 text-sm mb-10">Predictive Neighborhood Maintenance</div>
          <h2 className="text-3xl font-bold text-navy mb-2">Neighborhood Maintenance Forecast</h2>
          <h3 className="text-2xl text-gray-700 mb-4">{sub.name}</h3>
          <div className="text-gray-500 mb-10">Prepared {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>

          <div className="max-w-xl mx-auto text-left text-gray-600 leading-relaxed">
            <p>
              Based on public property records, the {sub.total_homes} homes in {sub.name} (built {sub.year_built_min}–{sub.year_built_max},
              primarily {sub.year_built_mode}) are approaching key maintenance milestones. This forecast identifies which systems need
              attention and how group-rate coordination can save your homeowners money.
            </p>
          </div>

          <div className="mt-8 text-xl font-bold text-primary">
            Overall Urgency Score: {forecast.urgency_score}/100
          </div>
        </div>

        {/* Page 2: System breakdown */}
        <div className="p-10 border-b border-gray-200 print:border-0 print:break-after-page">
          <h2 className="text-2xl font-bold text-navy mb-6">System-by-System Analysis</h2>

          {mainSystems.map(([key, sys]) => (
            <div key={key} className="mb-8">
              <h3 className="text-lg font-semibold mb-2">{sys.display_name}</h3>
              {/* Stacked bar */}
              <div className="w-full h-8 rounded-full overflow-hidden flex bg-gray-100 mb-2">
                {sys.pct_critical > 0 && <div className="bg-red-500 h-full flex items-center justify-center text-xs font-bold text-white" style={{ width: `${sys.pct_critical}%` }}>{sys.pct_critical >= 8 ? `${sys.pct_critical}%` : ''}</div>}
                {sys.pct_due_now > 0 && <div className="bg-orange-400 h-full flex items-center justify-center text-xs font-bold text-white" style={{ width: `${sys.pct_due_now}%` }}>{sys.pct_due_now >= 8 ? `${sys.pct_due_now}%` : ''}</div>}
                {sys.pct_upcoming > 0 && <div className="bg-yellow-400 h-full flex items-center justify-center text-xs font-bold text-gray-900" style={{ width: `${sys.pct_upcoming}%` }}>{sys.pct_upcoming >= 8 ? `${sys.pct_upcoming}%` : ''}</div>}
                {sys.pct_ok > 0 && <div className="bg-green-500 h-full flex items-center justify-center text-xs font-bold text-white" style={{ width: `${sys.pct_ok}%` }}>{sys.pct_ok >= 8 ? `${sys.pct_ok}%` : ''}</div>}
              </div>
              <div className="text-sm text-gray-600 mb-1">
                Critical: {sys.pct_critical}% · Due Now: {sys.pct_due_now}% · Upcoming: {sys.pct_upcoming}% · OK: {sys.pct_ok}%
              </div>
              <div className="text-sm">
                <strong>{sys.estimated_homes_needing_service}</strong> homes need service ·
                Retail: <strong>${sys.avg_cost_retail.toLocaleString()}</strong> ·
                Group: <strong className="text-primary">${sys.avg_cost_group.toLocaleString()}</strong> ·
                Savings: <strong className="text-primary">${sys.total_savings_potential.toLocaleString()}</strong>
              </div>
            </div>
          ))}

          {/* Cost comparison table */}
          <h3 className="text-lg font-semibold mb-3 mt-10">Cost Comparison Summary</h3>
          <table className="w-full text-sm border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left border-b">System</th>
                <th className="px-4 py-2 text-right border-b">Homes</th>
                <th className="px-4 py-2 text-right border-b">Retail Cost</th>
                <th className="px-4 py-2 text-right border-b">Group Cost</th>
                <th className="px-4 py-2 text-right border-b">Total Savings</th>
              </tr>
            </thead>
            <tbody>
              {mainSystems.map(([key, sys]) => (
                <tr key={key} className="border-b border-gray-100">
                  <td className="px-4 py-2">{sys.display_name}</td>
                  <td className="px-4 py-2 text-right">{sys.estimated_homes_needing_service}</td>
                  <td className="px-4 py-2 text-right">${sys.avg_cost_retail.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">${sys.avg_cost_group.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right font-semibold text-primary">${sys.total_savings_potential.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-teal-tint font-bold">
                <td className="px-4 py-2" colSpan={4}>Total Estimated Savings</td>
                <td className="px-4 py-2 text-right text-primary">${forecast.estimated_total_savings.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Page 3: How it works */}
        <div className="p-10">
          <h2 className="text-2xl font-bold text-navy mb-6">How HomeSync Works</h2>
          <ol className="space-y-3 text-gray-600 mb-8">
            <li><strong>1.</strong> We analyze public property records to identify maintenance milestones for your neighborhood.</li>
            <li><strong>2.</strong> We pre-negotiate group rates with licensed, insured contractors (25–40% below retail).</li>
            <li><strong>3.</strong> Homeowners opt in — no obligation, no cost to the HOA.</li>
            <li><strong>4.</strong> We coordinate scheduling, quality assurance, and completion tracking.</li>
            <li><strong>5.</strong> Homeowners save money. The neighborhood stays well-maintained.</li>
          </ol>

          <h3 className="text-lg font-semibold mb-3">Next Steps</h3>
          <ul className="space-y-2 text-gray-600 mb-10">
            <li>• Review this forecast with your HOA board</li>
            <li>• We present at your next board meeting (15 minutes)</li>
            <li>• Board approves — we handle everything from there</li>
            <li>• <strong>No cost to the HOA. Homeowners pay only if they opt in.</strong></li>
          </ul>

          <div className="text-center pt-8 border-t border-gray-200">
            <div className="text-primary font-bold text-lg">HomeSync</div>
            <div className="text-gray-500 text-sm">Predictive Neighborhood Maintenance</div>
          </div>
        </div>
      </div>
    </div>
  );
}
