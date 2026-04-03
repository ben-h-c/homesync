import { useState, useEffect } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { fetchAPI } from '../api/client';

const CATEGORIES = ['hoa', 'homeowner', 'contractor', 'follow_up'];

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);
  const load = () => fetchAPI('/emails/templates').then(setTemplates).catch(() => {});

  const handleCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ name: '', category: 'hoa', description: '', subject_template: '', body_html_template: '', body_text_template: '' });
  };

  const handleEdit = (t) => {
    setEditing(t.id);
    setCreating(false);
    setForm({ ...t });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (creating) {
        await fetchAPI('/emails/templates', { method: 'POST', body: JSON.stringify(form) });
      } else {
        await fetchAPI(`/emails/templates/${editing}`, { method: 'PUT', body: JSON.stringify(form) });
      }
      setEditing(null);
      setCreating(false);
      await load();
    } catch {} finally { setSaving(false); }
  };

  const isEditing = editing || creating;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <button onClick={handleCreate} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
          <Plus size={16} /> New Template
        </button>
      </div>

      {isEditing && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{creating ? 'New Template' : 'Edit Template'}</h2>
            <button onClick={() => { setEditing(null); setCreating(false); }}><X size={18} className="text-gray-400" /></button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name (slug)</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. hoa_intro_pitch" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <input type="text" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Subject Template</label>
              <input type="text" value={form.subject_template} onChange={(e) => setForm({ ...form, subject_template: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Body HTML Template <span className="text-gray-400">(use {"{{variable_name}}"} for variables)</span></label>
              <textarea value={form.body_html_template} onChange={(e) => setForm({ ...form, body_html_template: e.target.value })}
                rows={8} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Body Plain Text (optional)</label>
              <textarea value={form.body_text_template || ''} onChange={(e) => setForm({ ...form, body_text_template: e.target.value })}
                rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEditing(null); setCreating(false); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm flex items-center gap-1.5">
                <Save size={14} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Subject</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {templates.map((t, i) => (
              <tr key={t.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                <td className="px-4 py-2.5 font-mono text-xs">{t.name}</td>
                <td className="px-4 py-2.5 capitalize">{t.category}</td>
                <td className="px-4 py-2.5 text-gray-600 truncate max-w-[250px]">{t.subject_template}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{t.description}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => handleEdit(t)} className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
