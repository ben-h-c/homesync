import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchAPI } from '../api/client';

const PAGE_SIZE = 50;

export default function PropertyList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [subdivision, setSubdivision] = useState(searchParams.get('subdivision') || '');
  const [zip, setZip] = useState(searchParams.get('zip') || '');
  const [yearMin, setYearMin] = useState(searchParams.get('year_built_min') || '');
  const [yearMax, setYearMax] = useState(searchParams.get('year_built_max') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'address');
  const [order, setOrder] = useState(searchParams.get('order') || 'asc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  // Unique filter values
  const [subdivisions, setSubdivisions] = useState([]);
  const [zips, setZips] = useState([]);

  useEffect(() => {
    fetchAPI('/properties/stats').then((stats) => {
      setSubdivisions([...new Set(stats.byZip.map(() => null))]);
      setZips(stats.byZip.map((z) => z.zip));
    }).catch(() => {});
    // Load distinct subdivisions
    fetchAPI('/subdivisions').then((subs) => {
      setSubdivisions(subs.map((s) => s.name));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [page, sort, order, subdivision, zip, yearMin, yearMax]);

  const loadData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', PAGE_SIZE);
    params.set('sort', sort);
    params.set('order', order);
    if (search) params.set('search', search);
    if (subdivision) params.set('subdivision', subdivision);
    if (zip) params.set('zip', zip);
    if (yearMin) params.set('year_built_min', yearMin);
    if (yearMax) params.set('year_built_max', yearMax);

    setSearchParams(params);

    try {
      const result = await fetchAPI(`/properties?${params.toString()}`);
      setData(result.data);
      setPagination(result.pagination);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleSort = (field) => {
    if (sort === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field);
      setOrder('asc');
    }
    setPage(1);
  };

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = ['address', 'subdivision', 'year_built', 'square_footage', 'assessed_value', 'owner_name', 'zip'];
    const csv = [
      headers.join(','),
      ...data.map((r) => headers.map((h) => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'properties.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo(() => [
    { accessorKey: 'address', header: 'Address', size: 250 },
    { accessorKey: 'subdivision', header: 'Subdivision', size: 150 },
    { accessorKey: 'year_built', header: 'Year Built', size: 100 },
    { accessorKey: 'square_footage', header: 'Sq Ft', size: 100,
      cell: ({ getValue }) => getValue()?.toLocaleString() },
    { accessorKey: 'assessed_value', header: 'Assessed Value', size: 130,
      cell: ({ getValue }) => getValue() ? `$${getValue().toLocaleString()}` : '' },
    { accessorKey: 'owner_name', header: 'Owner', size: 200 },
  ], []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const SortIcon = ({ field }) => {
    if (sort !== field) return <span className="text-gray-300 ml-1">&#x21C5;</span>;
    return <span className="text-primary ml-1">{order === 'asc' ? '&#x25B2;' : '&#x25BC;'}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Properties</h1>
        <div className="flex gap-2">
          <span className="text-sm text-gray-500 self-center">
            {pagination.total.toLocaleString()} total
          </span>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Address, owner, subdivision..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Subdivision</label>
            <select value={subdivision} onChange={(e) => { setSubdivision(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All</option>
              {subdivisions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">ZIP</label>
            <select value={zip} onChange={(e) => { setZip(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All</option>
              {zips.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Year Built</label>
            <div className="flex gap-1 items-center">
              <input type="number" placeholder="Min" value={yearMin}
                onChange={(e) => { setYearMin(e.target.value); setPage(1); }}
                className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm" />
              <span className="text-gray-400">-</span>
              <input type="number" placeholder="Max" value={yearMax}
                onChange={(e) => { setYearMax(e.target.value); setPage(1); }}
                className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm" />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {table.getHeaderGroups()[0].headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer select-none hover:bg-gray-100"
                    style={{ width: header.getSize() }}
                    onClick={() => handleSort(header.column.id)}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <SortIcon field={header.column.id} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">No properties found. Import some data first.</td></tr>
              ) : (
                table.getRowModel().rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-b border-gray-100 cursor-pointer hover:bg-teal-tint transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    onClick={() => navigate(`/properties/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
