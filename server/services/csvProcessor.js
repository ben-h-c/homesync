const { parse } = require('csv-parse/sync');

// Maps common qPublic CSV column names to database fields
const COLUMN_ALIASES = {
  'parcel id': 'parcel_id',
  'parcel': 'parcel_id',
  'location address': 'address',
  'property address': 'address',
  'address': 'address',
  'owner': 'owner_name',
  'owner name': 'owner_name',
  'mailing address': 'owner_mailing_address',
  'year built': 'year_built',
  'living area': 'square_footage',
  'sq ft': 'square_footage',
  'square footage': 'square_footage',
  'bedrooms': 'bedrooms',
  'beds': 'bedrooms',
  'bathrooms': 'bathrooms',
  'baths': 'bathrooms',
  'appraised value': 'assessed_value',
  'assessed value': 'assessed_value',
  'fair market value': 'assessed_value',
  'subdivision': 'subdivision',
  'neighborhood': 'subdivision',
  'lot size': 'lot_size_acres',
  'zip': 'zip',
  'zip code': 'zip',
  'city': 'city',
  'state': 'state',
  'property type': 'property_type',
};

const DB_FIELDS = [
  'parcel_id', 'address', 'city', 'state', 'zip', 'subdivision',
  'owner_name', 'owner_mailing_address', 'year_built', 'square_footage',
  'bedrooms', 'bathrooms', 'assessed_value', 'lot_size_acres', 'property_type',
  'latitude', 'longitude', 'notes'
];

function suggestMapping(csvHeader) {
  const normalized = csvHeader.toLowerCase().trim();
  return COLUMN_ALIASES[normalized] || null;
}

function parseCSV(csvText) {
  return parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });
}

function buildPreview(csvText) {
  const records = parseCSV(csvText);
  if (records.length === 0) {
    return { headers: [], rows: [], suggestedMappings: {}, totalRows: 0 };
  }

  const headers = Object.keys(records[0]);
  const suggestedMappings = {};
  for (const header of headers) {
    const suggestion = suggestMapping(header);
    if (suggestion) {
      suggestedMappings[header] = suggestion;
    }
  }

  return {
    headers,
    previewRows: records.slice(0, 10),
    suggestedMappings,
    totalRows: records.length,
    dbFields: DB_FIELDS,
  };
}

function applyMappings(records, mappings) {
  return records.map((row) => {
    const mapped = {};
    for (const [csvCol, dbField] of Object.entries(mappings)) {
      if (dbField && dbField !== '' && row[csvCol] !== undefined) {
        let value = row[csvCol];
        // Convert numeric fields
        if (['year_built', 'square_footage', 'bedrooms', 'assessed_value'].includes(dbField)) {
          value = parseInt(String(value).replace(/[,$]/g, ''), 10) || null;
        } else if (['bathrooms', 'lot_size_acres', 'latitude', 'longitude'].includes(dbField)) {
          value = parseFloat(String(value).replace(/[,$]/g, '')) || null;
        }
        mapped[dbField] = value;
      }
    }
    return mapped;
  });
}

function validateRow(row, index) {
  const errors = [];
  if (!row.parcel_id) errors.push(`Row ${index + 1}: missing parcel_id`);
  if (!row.address) errors.push(`Row ${index + 1}: missing address`);
  if (!row.zip) errors.push(`Row ${index + 1}: missing zip`);
  return errors;
}

module.exports = { parseCSV, buildPreview, applyMappings, validateRow, DB_FIELDS };
