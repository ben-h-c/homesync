import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, Map, Users, X } from 'lucide-react';
import { fetchAPI } from '../api/client';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState({ properties: [], contacts: [], subdivisions: [] });
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const doSearch = async (q) => {
    if (q.length < 2) { setResults({ properties: [], contacts: [], subdivisions: [] }); return; }
    setLoading(true);
    try {
      const [props, contacts, subs] = await Promise.all([
        fetchAPI(`/properties?search=${encodeURIComponent(q)}&limit=5`),
        fetchAPI(`/contacts?search=${encodeURIComponent(q)}`),
        fetchAPI('/subdivisions'),
      ]);
      const filteredSubs = subs.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5);
      const filteredContacts = (contacts.data || contacts).slice(0, 5);
      setResults({
        properties: (props.data || []).slice(0, 5),
        contacts: filteredContacts,
        subdivisions: filteredSubs,
      });
    } catch {
      setResults({ properties: [], contacts: [], subdivisions: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    setOpen(q.length >= 2);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(q), 250);
  };

  const go = (path) => { navigate(path); setOpen(false); setQuery(''); };

  const hasResults = results.properties.length + results.contacts.length + results.subdivisions.length > 0;

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search properties, contacts, subdivisions..."
          className="w-full pl-9 pr-8 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:bg-white/15 focus:border-white/30"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="absolute right-2.5 top-2.5 text-white/40 hover:text-white/70">
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
          {loading && <div className="px-4 py-3 text-sm text-gray-400">Searching...</div>}
          {!loading && !hasResults && query.length >= 2 && (
            <div className="px-4 py-3 text-sm text-gray-400">No results for "{query}"</div>
          )}

          {results.subdivisions.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 flex items-center gap-1"><Map size={12} /> Subdivisions</div>
              {results.subdivisions.map((s) => (
                <div key={`s-${s.id}`} onClick={() => go(`/subdivisions/${s.id}`)}
                  className="px-4 py-2 text-sm hover:bg-teal-tint cursor-pointer border-b border-gray-50">
                  <span className="font-medium text-near-black">{s.name}</span>
                  <span className="text-gray-400 ml-2">{s.total_homes} homes · urgency {s.maintenance_urgency_score}</span>
                </div>
              ))}
            </div>
          )}

          {results.contacts.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 flex items-center gap-1"><Users size={12} /> Contacts</div>
              {results.contacts.map((c) => (
                <div key={`c-${c.id}`} onClick={() => go(`/contacts/${c.id}`)}
                  className="px-4 py-2 text-sm hover:bg-teal-tint cursor-pointer border-b border-gray-50">
                  <span className="font-medium text-near-black">{c.first_name} {c.last_name}</span>
                  <span className="text-gray-400 ml-2">{c.type?.replace(/_/g, ' ')} · {c.company || c.subdivision || ''}</span>
                </div>
              ))}
            </div>
          )}

          {results.properties.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 flex items-center gap-1"><Home size={12} /> Properties</div>
              {results.properties.map((p) => (
                <div key={`p-${p.id}`} onClick={() => go(`/properties/${p.id}`)}
                  className="px-4 py-2 text-sm hover:bg-teal-tint cursor-pointer border-b border-gray-50">
                  <span className="font-medium text-near-black">{p.address}</span>
                  <span className="text-gray-400 ml-2">{p.subdivision} · {p.year_built}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
