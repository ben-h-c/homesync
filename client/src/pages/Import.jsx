import { useState, useRef } from 'react';
import { Upload, FileUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { fetchAPI } from '../api/client';

const DB_FIELDS = [
  { value: '', label: '— skip —' },
  { value: 'parcel_id', label: 'Parcel ID' },
  { value: 'address', label: 'Address' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'zip', label: 'ZIP' },
  { value: 'subdivision', label: 'Subdivision' },
  { value: 'owner_name', label: 'Owner Name' },
  { value: 'owner_mailing_address', label: 'Mailing Address' },
  { value: 'year_built', label: 'Year Built' },
  { value: 'square_footage', label: 'Square Footage' },
  { value: 'bedrooms', label: 'Bedrooms' },
  { value: 'bathrooms', label: 'Bathrooms' },
  { value: 'assessed_value', label: 'Assessed Value' },
  { value: 'lot_size_acres', label: 'Lot Size (acres)' },
  { value: 'property_type', label: 'Property Type' },
  { value: 'notes', label: 'Notes' },
];

export default function Import() {
  const fileRef = useRef(null);
  const [csvText, setCsvText] = useState(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const [mappings, setMappings] = useState({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError(null);

    const text = await file.text();
    setCsvText(text);

    try {
      const data = await fetchAPI('/import/preview', {
        method: 'POST',
        body: JSON.stringify({ csvText: text }),
      });
      setPreview(data);
      setMappings(data.suggestedMappings || {});
    } catch (err) {
      setError('Failed to parse CSV: ' + err.message);
    }
  };

  const updateMapping = (csvCol, dbField) => {
    setMappings((prev) => ({ ...prev, [csvCol]: dbField }));
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    try {
      const data = await fetchAPI('/properties/import', {
        method: 'POST',
        body: JSON.stringify({ csvText, mappings }),
      });
      setResult(data);
    } catch (err) {
      setError('Import failed: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const hasMappedRequired = mappings && Object.values(mappings).includes('parcel_id')
    && Object.values(mappings).includes('address')
    && Object.values(mappings).includes('zip');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Import Property Data</h1>

      {/* Upload area */}
      <div
        className="bg-white rounded-lg shadow-sm p-8 mb-6 border-2 border-dashed border-gray-300 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={40} className="mx-auto mb-3 text-gray-400" />
        <p className="text-lg font-medium text-gray-700">
          {fileName || 'Click to upload a CSV file'}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Supports qPublic property record exports
        </p>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2 text-red-700">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Preview + Column Mapping */}
      {preview && !result && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-1">
            Preview — {preview.totalRows} rows found
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Map each CSV column to a database field. Required: Parcel ID, Address, ZIP.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  {preview.headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left">
                      <div className="font-medium text-gray-700 mb-1 truncate max-w-[160px]">{h}</div>
                      <select
                        value={mappings[h] || ''}
                        onChange={(e) => updateMapping(h, e.target.value)}
                        className={`w-full border rounded px-2 py-1 text-xs ${
                          mappings[h] ? 'border-primary bg-teal-tint' : 'border-gray-300'
                        }`}
                      >
                        {DB_FIELDS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.previewRows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-teal-tint/50'}>
                    {preview.headers.map((h) => (
                      <td key={h} className="px-3 py-1.5 truncate max-w-[160px] text-gray-600">
                        {row[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!hasMappedRequired && (
            <p className="text-amber-600 text-sm mt-3">
              Please map at least Parcel ID, Address, and ZIP before importing.
            </p>
          )}

          <button
            onClick={handleImport}
            disabled={importing || !hasMappedRequired}
            className="mt-4 px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {importing ? (
              <><Loader2 size={18} className="animate-spin" /> Importing...</>
            ) : (
              <><FileUp size={18} /> Import {preview.totalRows} Properties</>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-success mb-4">
            <CheckCircle size={22} /> Import Complete
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-success">{result.imported}</div>
              <div className="text-sm text-gray-600">Imported</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber">{result.skipped}</div>
              <div className="text-sm text-gray-600">Skipped (duplicates)</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-danger">{result.errors.length}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 max-h-40 overflow-y-auto">
              {result.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
          <button
            onClick={() => { setPreview(null); setResult(null); setCsvText(null); setFileName(''); }}
            className="mt-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Import Another File
          </button>
        </div>
      )}
    </div>
  );
}
