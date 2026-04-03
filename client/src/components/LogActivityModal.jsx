import { useState } from 'react';
import { X } from 'lucide-react';
import { fetchAPI } from '../api/client';

const ACTIVITY_TYPES = [
  { value: 'phone_call', label: 'Phone Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'pitch', label: 'Pitch' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'email_sent', label: 'Email Sent' },
  { value: 'note', label: 'Note' },
];

const OUTCOMES = [
  { value: '', label: '— none —' },
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
  { value: 'no_response', label: 'No Response' },
];

export default function LogActivityModal({ contactId, subdivisionId, projectId, preFill = {}, onClose, onSaved }) {
  const [form, setForm] = useState({
    type: preFill.type || 'note',
    subject: preFill.subject || '',
    description: preFill.description || '',
    outcome: '',
    contact_id: contactId || null,
    subdivision_id: subdivisionId || null,
    project_id: projectId || null,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.outcome) delete payload.outcome;
      await fetchAPI('/activities', { method: 'POST', body: JSON.stringify(payload) });
      onSaved?.();
      onClose();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Log Activity</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {ACTIVITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Subject</label>
            <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Brief summary" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} placeholder="Details..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Outcome</label>
            <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {OUTCOMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.subject}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Activity'}
          </button>
        </div>
      </div>
    </div>
  );
}
