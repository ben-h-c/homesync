import { useState, useEffect, Fragment } from 'react';
import { Download } from 'lucide-react';
import { fetchAPI } from '../api/client';
import EmailNav from '../components/EmailNav';

export default function EmailSent() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchAPI('/emails/sent').then((r) => setEmails(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

  const exportCSV = () => {
    const headers = ['to_email', 'to_name', 'subject', 'status', 'template_used', 'sent_at'];
    const csv = [headers.join(','), ...emails.map((e) => headers.map((h) => `"${(e[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sent-emails.csv'; a.click();
  };

  return (
    <div>
      <EmailNav />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sent Emails</h1>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-600">To</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Subject</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Template</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Sent</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : emails.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No emails sent yet.</td></tr>
            ) : emails.map((e, i) => (
              <Fragment key={e.id}>
                <tr className={`border-b border-gray-100 cursor-pointer hover:bg-teal-tint ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                  <td className="px-4 py-2.5">{e.to_name || e.to_email}</td>
                  <td className="px-4 py-2.5 font-medium">{e.subject}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">{e.template_used || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${e.status === 'sent' ? 'bg-green-100 text-green-700' : e.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{e.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{formatDate(e.sent_at)}</td>
                </tr>
                {expanded === e.id && (
                  <tr><td colSpan={5} className="px-4 py-4 bg-gray-50 border-b">
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: e.body_html }} />
                  </td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
