import { useState, useEffect } from 'react';
import { Save, RefreshCw, Loader2 } from 'lucide-react';
import { fetchAPI } from '../api/client';

const EDITABLE_FIELDS = [
  { key: 'avg_lifespan_years', label: 'Lifespan (yrs)', type: 'number', width: 'w-20' },
  { key: 'warning_years_before', label: 'Warn Before', type: 'number', width: 'w-20' },
  { key: 'critical_years_after', label: 'Critical After', type: 'number', width: 'w-20' },
  { key: 'avg_replacement_cost_low', label: 'Cost Low ($)', type: 'number', width: 'w-24' },
  { key: 'avg_replacement_cost_high', label: 'Cost High ($)', type: 'number', width: 'w-24' },
  { key: 'group_discount_typical', label: 'Group Disc. (%)', type: 'number', width: 'w-20' },
];

export default function Settings() {
  const [rules, setRules] = useState([]);
  const [editing, setEditing] = useState(null); // rule id being edited
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const data = await fetchAPI('/maintenance/rules');
      setRules(data);
    } catch {}
  };

  const handleEdit = (rule) => {
    setEditing(rule.id);
    setForm({ ...rule });
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      for (const f of EDITABLE_FIELDS) {
        payload[f.key] = f.type === 'number' ? Number(form[f.key]) : form[f.key];
      }
      await fetchAPI(`/maintenance/rules/${editing}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setEditing(null);
      await loadRules();
      setMessage({ type: 'success', text: 'Rule saved. Recalculate forecasts to apply changes.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Save failed: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    setMessage(null);
    try {
      const result = await fetchAPI('/maintenance/recalculate-all', { method: 'POST' });
      setMessage({ type: 'success', text: `Recalculated forecasts for ${result.updated} subdivisions.` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Recalculation failed: ' + err.message });
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {recalculating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {recalculating ? 'Recalculating...' : 'Recalculate All Forecasts'}
        </button>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold">Maintenance Rules</h2>
          <p className="text-sm text-gray-500 mt-0.5">These rules drive the predictive maintenance forecasts. Edit a rule, then recalculate to apply.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600">System</th>
                {EDITABLE_FIELDS.map((f) => (
                  <th key={f.key} className="px-3 py-3 text-left font-medium text-gray-600">{f.label}</th>
                ))}
                <th className="px-4 py-3 text-left font-medium text-gray-600">Recurring</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, i) => {
                const isEditing = editing === rule.id;
                return (
                  <tr key={rule.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-2.5 font-medium">{rule.display_name}</td>
                    {EDITABLE_FIELDS.map((f) => (
                      <td key={f.key} className="px-3 py-2.5">
                        {isEditing ? (
                          <input
                            type="number"
                            step={f.key === 'group_discount_typical' ? '0.05' : '1'}
                            value={form[f.key] ?? ''}
                            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                            className={`${f.width} border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30`}
                          />
                        ) : (
                          <span>
                            {f.key === 'group_discount_typical'
                              ? `${Math.round((rule[f.key] || 0) * 100)}%`
                              : f.key.includes('cost')
                                ? `$${(rule[f.key] || 0).toLocaleString()}`
                                : rule[f.key]}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-2.5">
                      {rule.is_recurring ? <span className="text-primary">Yes</span> : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isEditing ? (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => setEditing(null)} className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50">Cancel</button>
                          <button onClick={handleSave} disabled={saving} className="px-2 py-1 bg-primary text-white rounded text-xs hover:bg-primary/90 flex items-center gap-1">
                            <Save size={12} /> {saving ? '...' : 'Save'}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => handleEdit(rule)} className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50">Edit</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
