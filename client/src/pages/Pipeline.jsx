import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAPI } from '../api/client';
import UrgencyBadge from '../components/UrgencyBadge';

const STAGES = [
  { key: 'research', label: 'Research', color: 'bg-gray-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
  { key: 'meeting_scheduled', label: 'Meeting Scheduled', color: 'bg-indigo-500' },
  { key: 'pitched', label: 'Pitched', color: 'bg-purple-500' },
  { key: 'approved', label: 'Approved', color: 'bg-teal-500' },
  { key: 'active', label: 'Active', color: 'bg-green-500' },
  { key: 'completed', label: 'Completed', color: 'bg-green-700' },
];

const DECLINED_STAGE = { key: 'declined', label: 'Declined', color: 'bg-red-500' };

export default function Pipeline() {
  const navigate = useNavigate();
  const [subdivisions, setSubdivisions] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [dragItem, setDragItem] = useState(null);

  const load = () => {
    fetchAPI('/subdivisions').then(setSubdivisions).catch(() => {});
    fetchAPI('/contacts').then(setContacts).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const getSubsForStage = (stage) =>
    subdivisions.filter((s) => (s.pipeline_stage || 'research') === stage);

  const getPrimaryContact = (subName) =>
    contacts.find((c) => c.subdivision === subName && c.type === 'hoa_board');

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

  const handleDragStart = (e, sub) => {
    setDragItem(sub);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, stage) => {
    e.preventDefault();
    if (!dragItem || dragItem.pipeline_stage === stage) {
      setDragItem(null);
      return;
    }

    const oldStage = dragItem.pipeline_stage || 'research';

    // Optimistic update
    setSubdivisions((prev) =>
      prev.map((s) => s.id === dragItem.id ? { ...s, pipeline_stage: stage } : s)
    );
    setDragItem(null);

    // API update
    await fetchAPI(`/subdivisions/${dragItem.id}`, {
      method: 'PUT',
      body: JSON.stringify({ pipeline_stage: stage }),
    });

    // Auto-log status_change activity
    await fetchAPI('/activities', {
      method: 'POST',
      body: JSON.stringify({
        subdivision_id: dragItem.id,
        type: 'status_change',
        subject: `Pipeline: ${oldStage.replace(/_/g, ' ')} → ${stage.replace(/_/g, ' ')}`,
        description: `${dragItem.name} moved from "${oldStage.replace(/_/g, ' ')}" to "${stage.replace(/_/g, ' ')}"`,
      }),
    });
  };

  const allStages = [...STAGES, DECLINED_STAGE];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pipeline</h1>

      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 160px)' }}>
        {allStages.map((stage) => {
          const subs = getSubsForStage(stage.key);
          return (
            <div
              key={stage.key}
              className={`shrink-0 w-56 rounded-lg bg-gray-50 flex flex-col ${
                stage.key === 'declined' ? 'ml-4 opacity-70' : ''
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              {/* Column header */}
              <div className="px-3 py-2.5 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <span className="text-sm font-semibold">{stage.label}</span>
                  <span className="ml-auto text-xs text-gray-400 bg-gray-200 rounded-full px-1.5 py-0.5">{subs.length}</span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {subs.map((sub) => {
                  const contact = getPrimaryContact(sub.name);
                  return (
                    <div
                      key={sub.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, sub)}
                      className="bg-white rounded-lg shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border border-gray-100"
                    >
                      <div
                        className="font-medium text-sm mb-1.5 hover:text-primary cursor-pointer"
                        onClick={() => navigate(`/subdivisions/${sub.id}`)}
                      >
                        {sub.name}
                      </div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500">{sub.total_homes} homes</span>
                        <UrgencyBadge score={sub.maintenance_urgency_score} size="sm" />
                      </div>
                      {contact && (
                        <div className="text-xs text-gray-500 truncate">{contact.first_name} {contact.last_name}</div>
                      )}
                      {sub.last_contacted && (
                        <div className="text-xs text-gray-400 mt-1">Last: {formatDate(sub.last_contacted)}</div>
                      )}
                    </div>
                  );
                })}
                {subs.length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-4">Drop here</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
