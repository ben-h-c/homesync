import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAPI } from '../api/client';
import useAuthStore from '../store/authStore';
import {
  List, Columns3, Filter, DollarSign, TrendingUp, X, Plus, Clock,
  FileText, ChevronRight, ArrowUpDown, MessageSquare,
} from 'lucide-react';

const STAGES = [
  { key: 'new', label: 'New Leads', color: 'bg-gray-400', ring: 'ring-gray-300', source: 'lead' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-400', ring: 'ring-blue-300', source: 'lead' },
  { key: 'proposal_sent', label: 'Quoted', color: 'bg-purple-400', ring: 'ring-purple-300', source: 'lead' },
  { key: 'negotiating', label: 'Negotiating', color: 'bg-amber-400', ring: 'ring-amber-300', source: 'lead' },
  { key: 'won', label: 'Won — Scheduled', color: 'bg-teal-400', ring: 'ring-teal-300', source: 'both' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-500', ring: 'ring-blue-400', source: 'project' },
  { key: 'completed', label: 'Completed', color: 'bg-green-500', ring: 'ring-green-400', source: 'project' },
  { key: 'lost', label: 'Lost / Cancelled', color: 'bg-red-400', ring: 'ring-red-300', source: 'both' },
];

function daysSince(dateStr) {
  if (!dateStr) return null;
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  return days >= 0 ? days : null;
}

// ── Card Detail Drawer ──
function CardDrawer({ card, onClose, onRefresh }) {
  const navigate = useNavigate();
  const [note, setNote] = useState('');

  const addNote = async () => {
    if (!note.trim()) return;
    if (card._type === 'lead') {
      const existing = card.notes || '';
      await fetchAPI(`/leads/${card.id}`, { method: 'PUT', body: JSON.stringify({ notes: existing + '\n' + note }) });
    } else {
      await fetchAPI(`/jobs/${card.id}/activity`, { method: 'POST', body: JSON.stringify({ type: 'note', description: note }) });
    }
    setNote('');
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-bold text-gray-900 truncate">{card.title || card.subdivision_name || 'Untitled'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-500">Type</span>
              <p className="font-medium capitalize">{card._type}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-500">Service</span>
              <p className="font-medium capitalize">{(card.service_type || '—').replace(/_/g, ' ')}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-500">Value</span>
              <p className="font-medium text-green-700">${(card.estimated_value || card.estimated_cost || 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-500">Days in Stage</span>
              <p className="font-medium">{daysSince(card.updated_at) ?? '—'}</p>
            </div>
            {card.client_name && (
              <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                <span className="text-xs text-gray-500">Client</span>
                <p className="font-medium">{card.client_name}</p>
              </div>
            )}
            {card.subdivision_name && (
              <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                <span className="text-xs text-gray-500">Subdivision</span>
                <p className="font-medium">{card.subdivision_name}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {card.notes && (
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</span>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{card.notes}</p>
            </div>
          )}
          {card.description && (
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</span>
              <p className="text-sm text-gray-700 mt-1">{card.description}</p>
            </div>
          )}

          {/* Add Note */}
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Add Note</span>
            <div className="flex gap-2">
              <input value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Quick note..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onKeyDown={(e) => e.key === 'Enter' && addNote()} />
              <button onClick={addNote} className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium">Add</button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">Actions</span>
            {card._type === 'lead' && (
              <>
                <button onClick={() => { navigate(`/jobs/new?lead_id=${card.id}`); onClose(); }}
                  className="w-full py-2 text-sm font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 flex items-center justify-center gap-2">
                  <Plus size={14} /> Convert to Project
                </button>
                <button onClick={() => { navigate(`/subdivisions/${card.subdivision_id}`); onClose(); }}
                  className="w-full py-2 text-sm font-medium bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2">
                  <ChevronRight size={14} /> View Subdivision
                </button>
              </>
            )}
            {card._type === 'project' && (
              <>
                <button onClick={() => { navigate(`/jobs/${card.id}`); onClose(); }}
                  className="w-full py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2">
                  <FileText size={14} /> Full Project Detail
                </button>
                <button onClick={() => { navigate(`/invoices/new?job_id=${card.id}`); onClose(); }}
                  className="w-full py-2 text-sm font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 flex items-center justify-center gap-2">
                  <DollarSign size={14} /> Create Invoice
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Pipeline Component ──
export default function UnifiedPipeline() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const viewAsTier = useAuthStore((s) => s.viewAsTier);
  const effectiveTier = viewAsTier || (user?.role === 'admin' ? 'enterprise' : (user?.subscription_tier || 'starter'));
  const canDrag = effectiveTier !== 'starter';

  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [sourceFilter, setSourceFilter] = useState('all'); // all, leads, projects
  const [serviceFilter, setServiceFilter] = useState('');
  const [listSort, setListSort] = useState('updated_at');
  const [listOrder, setListOrder] = useState('desc');

  const load = async () => {
    setLoading(true);
    const [l, p] = await Promise.all([
      fetchAPI('/leads').catch(() => []),
      fetchAPI('/jobs').catch(() => []),
    ]);
    setLeads(l);
    setProjects(p);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Normalize leads and projects into unified cards
  const allCards = useMemo(() => {
    const cards = [];

    if (sourceFilter !== 'projects') {
      leads.forEach((l) => {
        if (serviceFilter && l.service_type !== serviceFilter) return;
        cards.push({
          ...l,
          _type: 'lead',
          _stage: l.stage,
          _value: l.estimated_value || 0,
          _name: l.subdivision_name || `Lead #${l.id}`,
          _client: l.contact_name || '',
          _service: l.service_type,
          _updated: l.updated_at,
        });
      });
    }

    if (sourceFilter !== 'leads') {
      projects.forEach((p) => {
        if (serviceFilter && p.service_type !== serviceFilter) return;
        // Map project status to pipeline stage
        const stageMap = {
          not_started: 'won', scheduled: 'won',
          in_progress: 'in_progress',
          completed: 'completed',
          on_hold: 'negotiating',
          cancelled: 'lost',
        };
        const stage = stageMap[p.status] || 'won';
        // Skip projects whose lead is already showing as 'won'
        if (sourceFilter === 'all' && p.lead_id && leads.some(l => l.id === p.lead_id && l.stage === 'won')) {
          // Show project card instead of lead card for won leads with projects
        }
        cards.push({
          ...p,
          _type: 'project',
          _stage: stage,
          _value: p.estimated_cost || p.total_revenue || 0,
          _name: p.title || `Project #${p.id}`,
          _client: p.client_name || '',
          _service: p.service_type,
          _updated: p.updated_at,
        });
      });
    }

    return cards;
  }, [leads, projects, sourceFilter, serviceFilter]);

  // Group by stage
  const grouped = useMemo(() => {
    const g = {};
    STAGES.forEach((s) => { g[s.key] = []; });
    allCards.forEach((c) => { if (g[c._stage]) g[c._stage].push(c); });
    return g;
  }, [allCards]);

  // Stats
  const stats = useMemo(() => {
    const totalValue = allCards.reduce((s, c) => s + c._value, 0);
    const wonCount = (grouped.won?.length || 0) + (grouped.in_progress?.length || 0) + (grouped.completed?.length || 0);
    const totalLeads = allCards.filter(c => c._type === 'lead').length;
    const convRate = totalLeads > 0 ? Math.round((wonCount / (totalLeads + wonCount)) * 100) : 0;
    return { total: allCards.length, totalValue, wonCount, convRate };
  }, [allCards, grouped]);

  // Drag handlers
  const handleDrop = async (e, newStage) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('card');
    if (!data) return;
    const { id, type, currentStage } = JSON.parse(data);
    if (currentStage === newStage) return;

    if (type === 'lead') {
      await fetchAPI(`/leads/${id}`, { method: 'PUT', body: JSON.stringify({ stage: newStage }) });
    } else {
      const statusMap = { won: 'not_started', in_progress: 'in_progress', completed: 'completed', lost: 'cancelled' };
      const newStatus = statusMap[newStage];
      if (newStatus) await fetchAPI(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
    }
    load();
  };

  // List sort
  const sortedList = useMemo(() => {
    return [...allCards].sort((a, b) => {
      let av = a[listSort] || a[`_${listSort}`] || '';
      let bv = b[listSort] || b[`_${listSort}`] || '';
      if (typeof av === 'string') return listOrder === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv);
      return listOrder === 'desc' ? bv - av : av - bv;
    });
  }, [allCards, listSort, listOrder]);

  const toggleSort = (field) => {
    if (listSort === field) setListOrder(listOrder === 'desc' ? 'asc' : 'desc');
    else { setListSort(field); setListOrder('desc'); }
  };

  if (loading) return <div className="py-12 text-center text-gray-400 animate-pulse">Loading pipeline...</div>;

  return (
    <div className="h-full flex flex-col -m-4 md:-m-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3 shrink-0 z-10">
        <h1 className="text-lg font-bold text-gray-900 mr-2">Pipeline</h1>

        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setView('kanban')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
            <Columns3 size={14} className="inline mr-1" />Board
          </button>
          <button onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
            <List size={14} className="inline mr-1" />List
          </button>
        </div>

        {/* Source Filter */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {['all', 'leads', 'projects'].map((s) => (
            <button key={s} onClick={() => setSourceFilter(s)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${sourceFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Service Filter */}
        <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white">
          <option value="">All Services</option>
          <option value="roofing">Roofing</option>
          <option value="hvac">HVAC</option>
          <option value="painting">Painting</option>
          <option value="plumbing">Plumbing</option>
          <option value="general">General</option>
        </select>

        {/* Stats */}
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
          <span><span className="font-semibold text-gray-700">{stats.total}</span> items</span>
          <span><span className="font-semibold text-green-600">${stats.totalValue.toLocaleString()}</span> value</span>
          <span><span className="font-semibold text-primary">{stats.convRate}%</span> conversion</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* ── KANBAN VIEW ── */}
        {view === 'kanban' && (
          <div className="flex gap-3 overflow-x-auto p-4 h-full">
            {STAGES.map((stage) => {
              const cards = grouped[stage.key] || [];
              const colValue = cards.reduce((s, c) => s + c._value, 0);
              return (
                <div key={stage.key} className="flex-shrink-0 w-60 flex flex-col"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, stage.key)}>
                  {/* Column Header */}
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{stage.label}</h3>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{cards.length}</span>
                    </div>
                    {colValue > 0 && <p className="text-[10px] text-gray-400 ml-4">${colValue.toLocaleString()}</p>}
                  </div>

                  {/* Cards */}
                  <div className="flex-1 space-y-2 overflow-y-auto min-h-[100px]">
                    {cards.length === 0 && (
                      <div className="text-[10px] text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-lg">
                        Drop here
                      </div>
                    )}
                    {cards.map((card) => (
                      <div key={`${card._type}-${card.id}`}
                        draggable={canDrag}
                        onDragStart={(e) => {
                          if (!canDrag) { e.preventDefault(); return; }
                          e.dataTransfer.setData('card', JSON.stringify({ id: card.id, type: card._type, currentStage: card._stage }));
                        }}
                        onClick={() => setSelectedCard(card)}
                        className={`bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-all ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${card._type === 'project' ? 'border-l-4 border-l-blue-400' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-xs text-gray-900 leading-snug">{card._name}</p>
                          <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded font-medium ${card._type === 'lead' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                            {card._type}
                          </span>
                        </div>
                        {card._client && <p className="text-[10px] text-gray-500 mt-1">{card._client}</p>}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] font-medium text-green-700">${card._value.toLocaleString()}</span>
                          <span className="text-[10px] text-gray-400 capitalize">{(card._service || '').replace(/_/g, ' ')}</span>
                        </div>
                        {card._updated && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Clock size={9} className="text-gray-300" />
                            <span className="text-[9px] text-gray-400">{daysSince(card._updated) || 0}d in stage</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <div className="overflow-auto h-full bg-white">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 border-b border-gray-200">
                  {[
                    { key: '_name', label: 'Name' },
                    { key: '_type', label: 'Type' },
                    { key: '_client', label: 'Client' },
                    { key: '_service', label: 'Service' },
                    { key: '_stage', label: 'Stage' },
                    { key: '_value', label: 'Value' },
                    { key: '_updated', label: 'Updated' },
                  ].map((col) => (
                    <th key={col.key}
                      className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => toggleSort(col.key)}>
                      <div className="flex items-center gap-1">
                        {col.label}
                        {listSort === col.key && <ArrowUpDown size={12} className="text-primary" />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedList.map((card, i) => (
                  <tr key={`${card._type}-${card.id}`}
                    onClick={() => setSelectedCard(card)}
                    className={`border-b border-gray-100 cursor-pointer hover:bg-teal-tint transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{card._name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${card._type === 'lead' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                        {card._type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{card._client || '—'}</td>
                    <td className="px-4 py-3 capitalize text-gray-500">{(card._service || '—').replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize">{card._stage?.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-green-700">${card._value.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{daysSince(card._updated) || 0}d ago</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Card Detail Drawer */}
      {selectedCard && (
        <CardDrawer card={selectedCard} onClose={() => setSelectedCard(null)} onRefresh={load} />
      )}
    </div>
  );
}
