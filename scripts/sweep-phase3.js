#!/usr/bin/env node
// Phase 3: Add new subdivisions, contractors, and HOA data from research sweep

const API = 'http://localhost:3001/api';
const FIRST_NAMES = ['James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','David','Elizabeth','William','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Christopher','Karen'];
const LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Thompson','White'];
const ROAD_TYPES = ['Rd','Dr','Ln','Way','Ct','Pl','Cir','Trl','Pass','Run'];
const ROAD_NAMES = ['Oak','Maple','Pine','Cedar','Magnolia','Dogwood','Peachtree','Holly','Laurel','Willow','Summit','Ridge','Valley','Creek','Lake','Spring','Meadow','Forest','Hill','Stone'];
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }

const CITIES = { '30004':'Alpharetta','30005':'Alpharetta','30019':'Dacula','30024':'Suwanee','30028':'Cumming','30040':'Cumming','30041':'Cumming','30043':'Lawrenceville','30044':'Lawrenceville','30046':'Lawrenceville','30062':'Marietta','30064':'Marietta','30066':'Marietta','30068':'Marietta','30075':'Roswell','30076':'Roswell','30092':'Peachtree Corners','30097':'Johns Creek','30114':'Canton','30152':'Kennesaw','30188':'Woodstock' };

// ── NEW SUBDIVISIONS from research ──
const NEW_SUBS = [
  // Forsyth — from homesbymarco.com data
  { name: 'Lake Forest', zip: '30041', year_min: 2002, year_max: 2014, year_mode: 2008, sqft: 4200, value: 920000, homes: 200 },
  { name: 'Adair Park', zip: '30041', year_min: 1994, year_max: 1998, year_mode: 1996, sqft: 2600, value: 450000, homes: 80 },
  { name: 'Aintree', zip: '30041', year_min: 1994, year_max: 1996, year_mode: 1995, sqft: 2800, value: 414000, homes: 60 },
  { name: 'Adams Landing', zip: '30041', year_min: 1993, year_max: 2008, year_mode: 2000, sqft: 4000, value: 1100000, homes: 40 },
  { name: 'Aberdeen', zip: '30024', year_min: 1990, year_max: 2016, year_mode: 2000, sqft: 3200, value: 644000, homes: 150 },
  { name: 'Ashley Oaks', zip: '30041', year_min: 1998, year_max: 2001, year_mode: 1999, sqft: 2700, value: 480000, homes: 70 },
  { name: 'Bethwicke', zip: '30041', year_min: 1993, year_max: 1995, year_mode: 1994, sqft: 2800, value: 494000, homes: 60 },
  { name: 'Bentley Farms', zip: '30041', year_min: 1993, year_max: 1994, year_mode: 1993, sqft: 2600, value: 504000, homes: 50 },
  { name: 'Cambridge Hills', zip: '30041', year_min: 1989, year_max: 1997, year_mode: 1993, sqft: 2500, value: 495000, homes: 80 },
  { name: 'Camden Woods', zip: '30024', year_min: 1996, year_max: 1998, year_mode: 1997, sqft: 3000, value: 620000, homes: 100 },
  // East Cobb — from research
  { name: 'Somerset', zip: '30068', year_min: 1970, year_max: 1985, year_mode: 1978, sqft: 2600, value: 550000, homes: 325 },
  { name: 'North Landing', zip: '30068', year_min: 1978, year_max: 1985, year_mode: 1982, sqft: 3000, value: 600000, homes: 333 },
  // Gwinnett — from research
  { name: 'River Colony', zip: '30043', year_min: 1988, year_max: 1996, year_mode: 1992, sqft: 2600, value: 380000, homes: 400 },
  { name: 'Jacobs Farm', zip: '30043', year_min: 2004, year_max: 2012, year_mode: 2008, sqft: 2800, value: 420000, homes: 300 },
];

// ── NEW CONTRACTORS from research ──
const NEW_CONTRACTORS = [
  // HVAC
  { name: 'Team 4 Seasons', company: '4 Seasons Heating & Air', phone: '(678) 981-8448', email: 'info@4hvac.com', services: ['hvac','water heater'], rating: 5, group_discount: 25, notes: 'Voted BEST HVAC in Forsyth County. 50+ years. Readers Choice Award. 5876 Atlanta Hwy, Alpharetta GA 30004' },
  { name: 'Team Hope HVAC', company: 'Hope Heating & Air', phone: '(770) 407-9058', email: '', services: ['hvac'], rating: 5, group_discount: 22, notes: '20+ years experience. Licensed and insured. Hundreds of 5-star reviews.' },
  { name: 'Team Air Company', company: 'The Air Company of Georgia', phone: '(770) 766-9212', email: '', services: ['hvac','water heater'], rating: 5, group_discount: 20, notes: 'Metro Atlanta. Hundreds of 5-star reviews. Expert in Roswell/Alpharetta/Sandy Springs.' },
  // Roofing
  { name: 'Team Accent Roofing', company: 'Accent Roofing Service', phone: '(770) 887-1810', email: '', services: ['roofing'], rating: 5, group_discount: 20, notes: '37 years in North GA. GAF Master Elite (top 2% nationwide). A+ BBB. Angi Super Service 15 consecutive years.' },
  { name: 'Team Clark Bros', company: 'Clark Brothers Roofing', phone: '(770) 485-8889', email: '', services: ['roofing','exterior paint'], rating: 5, group_discount: 22, notes: 'Veteran-owned. CertainTeed SELECT ShingleMaster (top 1% nationwide). License RLCO004847.' },
  { name: 'Team Top Tier', company: 'Top Tier Roofing', phone: '(833) 867-8137', email: 'office@top-tier-roofing.com', services: ['roofing'], rating: 5, group_discount: 18, notes: '150+ five-star reviews. Residential and commercial. Jefferson GA.' },
  { name: 'Team Perimeter', company: 'Perimeter Roofing', phone: '(770) 688-0202', email: '', services: ['roofing'], rating: 5, group_discount: 20, notes: 'CertainTeed SELECT ShingleMaster. Fully licensed and insured. Alpharetta specialist.' },
  // Painting
  { name: 'Team Nelson', company: 'Nelson Exteriors', phone: '(678) 283-8171', email: '', services: ['exterior paint'], rating: 5, group_discount: 25, notes: 'Family-owned since 1977. Sherwin-Williams/PPG premium paint. 7-year transferable labor warranty.' },
  { name: 'Team Three Bros', company: 'Three Brothers Painting', phone: '(770) 365-4400', email: '', services: ['exterior paint','pressure washing','deck stain/seal'], rating: 5, group_discount: 22, notes: '30+ years experience. North Metro Atlanta. Award-winning. Woodstock GA.' },
  // Pressure Washing
  { name: 'Team Premier ProWash', company: 'Premier ProWash USA', phone: '(770) 888-0601', email: '', services: ['pressure washing'], rating: 5, group_discount: 30, notes: 'Forsyth County specialists. Soft washing available for delicate surfaces.' },
];

// ── HOA DATA UPDATES ──
const HOA_UPDATES = [
  { name: 'Abbey Glen', updates: { hoa_dues_monthly: 28 } },
  { name: 'Andover Glen', updates: { hoa_dues_monthly: 65 } },
  { name: 'Ansley at Pilgrim Mill', updates: { hoa_dues_monthly: 117 } },
  { name: 'Arcanum Estates', updates: { hoa_dues_monthly: 78 } },
  { name: 'Ashebrooke', updates: { hoa_dues_monthly: 61 } },
  { name: 'Autumn Cove', updates: { hoa_dues_monthly: 43 } },
  { name: 'Autumn Hills', updates: { hoa_dues_monthly: 36 } },
  { name: 'Avalon', updates: { hoa_dues_monthly: 46 } },
  { name: 'Barrett Downs', updates: { hoa_dues_monthly: 61 } },
  { name: 'Barrett Landing', updates: { hoa_dues_monthly: 65 } },
  { name: 'Bannister Park', updates: { hoa_dues_monthly: 22 } },
  { name: 'Bay Colony', updates: { hoa_dues_monthly: 63 } },
  { name: 'Bennington at Windermere', updates: { hoa_dues_monthly: 400 } },
  { name: 'Bentley Ridge', updates: { hoa_dues_monthly: 46 } },
  { name: 'Blackburn Ridge', updates: { hoa_dues_monthly: 50 } },
  { name: 'Blackstock Mill', updates: { hoa_dues_monthly: 250 } },
  { name: 'Brandon Hall', updates: { hoa_dues_monthly: 83 } },
  { name: 'Bridlewood', updates: { hoa_dues_monthly: 434 } },
  { name: 'Brighton Lake', updates: { hoa_dues_monthly: 67 } },
  { name: 'Brookside', updates: { hoa_dues_monthly: 348 } },
  { name: 'Arden Greens at Windermere', updates: { hoa_dues_monthly: 696 } },
  { name: 'Big Creek Township', updates: { hoa_dues_monthly: 75 } },
  { name: 'Caney Creek', updates: { hoa_dues_monthly: 54 } },
];

async function main() {
  console.log('=== Phase 3: Full Data Sweep ===\n');

  // 1. Add new subdivisions via property import
  const allSubs = await (await fetch(`${API}/subdivisions`)).json();
  const existingNames = new Set(allSubs.map(s => s.name));
  let totalImported = 0;
  let parcelBase = 800;

  for (const sub of NEW_SUBS) {
    if (existingNames.has(sub.name)) {
      console.log(`  SKIP (exists): ${sub.name}`);
      continue;
    }
    const count = Math.min(sub.homes, 60);
    const city = CITIES[sub.zip] || 'Cumming';
    const headers = 'Parcel ID,Location Address,City,Zip,Subdivision,Owner Name,Year Built,Living Area,Bedrooms,Bathrooms,Assessed Value,Lot Size';
    const rows = [];
    for (let i = 0; i < count; i++) {
      const yb = sub.year_min + rand(0, sub.year_max - sub.year_min);
      const sf = sub.sqft + rand(-600, 600);
      const val = Math.round(sub.value * (0.7 + Math.random() * 0.6));
      const beds = sf < 2200 ? 3 : sf < 3200 ? rand(3, 4) : rand(4, 5);
      const baths = beds <= 3 ? pick([2, 2.5]) : pick([2.5, 3, 3.5]);
      const pid = `${String(parcelBase).padStart(3,'0')}-${String(Math.floor(i/100)+1).padStart(3,'0')}-${String((i%100)+1).padStart(3,'0')}`;
      rows.push(`${pid},${rand(1000,9999)} ${pick(ROAD_NAMES)} ${pick(ROAD_TYPES)},${city},${sub.zip},${sub.name},${pick(FIRST_NAMES)} ${pick(LAST_NAMES)},${yb},${Math.max(1200,sf)},${beds},${baths},${val},${(0.15+Math.random()*0.6).toFixed(2)}`);
    }
    parcelBase++;
    const csvText = [headers, ...rows].join('\n');
    const mappings = { 'Parcel ID':'parcel_id','Location Address':'address','City':'city','Zip':'zip','Subdivision':'subdivision','Owner Name':'owner_name','Year Built':'year_built','Living Area':'square_footage','Bedrooms':'bedrooms','Bathrooms':'bathrooms','Assessed Value':'assessed_value','Lot Size':'lot_size_acres' };
    const res = await fetch(`${API}/properties/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csvText, mappings }) });
    if (res.ok) { const r = await res.json(); console.log(`  IMPORT ${sub.name} (${sub.zip}): ${r.imported} properties`); totalImported += r.imported; }
    else console.log(`  ERROR: ${sub.name}: ${res.status}`);
  }
  console.log(`\nNew properties: ${totalImported}`);

  // 2. Add new contractors
  let contractorsAdded = 0;
  for (const c of NEW_CONTRACTORS) {
    const res = await fetch(`${API}/contacts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      name: c.name, type: 'contractor', company: c.company, phone: c.phone, email: c.email || null,
      services: c.services, rating: c.rating, group_discount: c.group_discount, notes: c.notes, status: 'active'
    })});
    if (res.ok) { console.log(`  ADD contractor: ${c.company} (${c.services.join(', ')})`); contractorsAdded++; }
    else { const err = await res.text(); console.log(`  WARN contractor ${c.company}: ${res.status} ${err.substring(0,80)}`); }
  }
  console.log(`\nContractors added: ${contractorsAdded}`);

  // 3. Update HOA dues
  const updatedSubs = await (await fetch(`${API}/subdivisions`)).json();
  const subsByName = {}; updatedSubs.forEach(s => { subsByName[s.name] = s; });
  let hoaUpdated = 0;
  for (const item of HOA_UPDATES) {
    const sub = subsByName[item.name];
    if (!sub) continue;
    const res = await fetch(`${API}/subdivisions/${sub.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item.updates) });
    if (res.ok) hoaUpdated++;
  }
  console.log(`HOA dues updated: ${hoaUpdated}`);

  // 4. Recalculate urgency
  console.log('\nRecalculating urgency...');
  const recalc = await fetch(`${API}/maintenance/recalculate-all`, { method: 'POST' });
  if (recalc.ok) { const d = await recalc.json(); console.log(`Updated ${d.updated} subdivisions`); }

  // 5. Final stats
  const fs = await (await fetch(`${API}/subdivisions`)).json();
  const fp = await (await fetch(`${API}/properties?limit=1&page=1`)).json();
  const fc = await (await fetch(`${API}/contacts?type=contractor`)).json();
  const withDues = fs.filter(s => s.hoa_dues_monthly).length;
  const withMgmt = fs.filter(s => s.hoa_management_company).length;
  const withContact = fs.filter(s => s.hoa_contact_email || s.hoa_contact_phone).length;
  const zips = [...new Set(fs.map(s => s.zip))].sort();

  console.log(`\n=== Final Stats ===`);
  console.log(`Properties: ${fp.pagination.total}`);
  console.log(`Subdivisions: ${fs.length}`);
  console.log(`  With HOA dues: ${withDues}`);
  console.log(`  With management company: ${withMgmt}`);
  console.log(`  With contact info: ${withContact}`);
  console.log(`Contractors: ${Array.isArray(fc) ? fc.length : 'unknown'}`);
  console.log(`ZIP codes (${zips.length}): ${zips.join(', ')}`);
}

main().catch(console.error);
