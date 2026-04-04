#!/usr/bin/env node
// Update subdivisions with researched HOA data and add new Cobb County communities.

const API = 'http://localhost:3001/api';

// ── HOA data updates for EXISTING subdivisions ──────────────────────
const HOA_UPDATES = [
  // Windward — Access Management Group
  { name: 'Windward', updates: {
    hoa_management_company: 'Access Management Group (AMG)',
    hoa_contact_name: 'Melissa Cuylear & David Hill',
    hoa_contact_email: 'windward@accessmgt.com',
    hoa_contact_phone: '(770) 802-8360',
    hoa_website: 'https://www.windwardhomesga.com',
    hoa_dues_monthly: 73, // $870/year
    hoa_meeting_schedule: 'Board meetings monthly',
  }},
  // Creekstone Estates — Access Management Group
  { name: 'Creekstone Estates', updates: {
    hoa_management_company: 'Access Management Group (AMG)',
    hoa_contact_name: 'Amber Tilley (Association Manager)',
    hoa_contact_email: 'info@accessmgt.com',
    hoa_contact_phone: '(770) 777-6890',
    hoa_website: 'https://www.creekstoneonline.com',
    hoa_dues_monthly: 127, // $1,529/year
  }},
  // Three Chimneys Farm
  { name: 'Three Chimneys Farm', updates: {
    hoa_website: 'http://3chimneysfarm.com',
    hoa_management_company: 'Enumerate (formerly AppFolio)',
  }},
  // Canterbury Farms
  { name: 'Canterbury Farms', updates: {
    hoa_dues_monthly: 28, // $340/year
  }},
  // Sugarloaf Country Club — Community Associates LLC
  { name: 'Sugarloaf Country Club', updates: {
    hoa_management_company: 'Community Associates LLC',
    hoa_contact_email: 'sugarloaf@mygreencondo.net',
    hoa_contact_phone: '(678) 856-6622',
    hoa_website: 'https://sugarloafcountryclub.com',
    hoa_dues_monthly: 193, // ~$2,316/year
    hoa_meeting_schedule: 'Office: Mon-Fri 9am-4pm at 3265 Sugarloaf Club Dr, Duluth GA 30097',
  }},
  // River Club
  { name: 'River Club', updates: {
    hoa_contact_phone: '(678) 541-6434',
    hoa_contact_email: 'info@RiverClub.com',
    hoa_website: 'https://riverclub.com',
  }},
  // BridgeMill
  { name: 'BridgeMill', updates: {
    hoa_management_company: 'BridgeMill Community Association (self-managed with on-site manager)',
    hoa_website: 'http://bridgemill.org',
  }},
  // Towne Mill — Exclusive Association Management
  { name: 'Towne Mill', updates: {
    hoa_management_company: 'Exclusive Association Management',
    hoa_website: 'https://www.townemillhoa.com',
  }},
  // Eagle Watch — Access Management
  { name: 'Eagle Watch', updates: {
    hoa_management_company: 'Access Management',
    hoa_website: 'https://www.eaglewatchhoa.org',
    total_homes: 1300,
  }},
  // Laurel Springs
  { name: 'Laurel Springs', updates: {
    hoa_website: 'https://laurelspringshoa.com',
  }},
  // Starr Lake
  { name: 'Starr Lake', updates: {
    hoa_dues_monthly: 58, // $700/year
  }},
];

// ── NEW subdivisions to add via property import ─────────────────────
const FIRST_NAMES = ['James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','David','Elizabeth','William','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Christopher','Karen','Charles','Lisa','Daniel','Nancy','Matthew','Betty','Anthony','Margaret','Mark','Sandra','Steven','Dorothy','Andrew','Kimberly','Paul','Emily','Joshua','Donna','Kenneth','Michelle','Kevin','Carol','Brian','Amanda','George','Melissa','Timothy','Deborah'];
const LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Thompson','White','Harris','Clark','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts','Phillips','Evans','Turner','Parker','Patel','Sharma'];
const ROAD_TYPES = ['Rd','Dr','Ln','Way','Ct','Pl','Cir','Trl','Pass','Run'];
const ROAD_NAMES = ['Oak','Maple','Pine','Cedar','Birch','Magnolia','Dogwood','Peachtree','Holly','Laurel','Willow','Chestnut','Summit','Ridge','Valley','Creek','Lake','Spring','Meadow','Forest','Hill','Stone','Eagle','Falcon','Hawk','Cardinal','Heron'];
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }

const NEW_SUBS = [
  // Cobb County — larger communities from research
  { name: 'Marietta Country Club', zip: '30064', city: 'Kennesaw', year_min: 1991, year_max: 2008, year_mode: 2000, sqft: 3400, value: 650000, homes: 800 },
  { name: 'Walkers Ridge', zip: '30064', city: 'Marietta', year_min: 1995, year_max: 2005, year_mode: 2000, sqft: 3000, value: 520000, homes: 314 },
  { name: 'Bells Ferry Crossing', zip: '30066', city: 'Marietta', year_min: 1996, year_max: 2004, year_mode: 2000, sqft: 2500, value: 380000, homes: 280 },
  { name: 'Piedmont Oaks', zip: '30066', city: 'Marietta', year_min: 1992, year_max: 2001, year_mode: 1997, sqft: 2700, value: 430000, homes: 220 },
  // North Fulton — from homeatlanta.com directory
  { name: 'Crooked Creek', zip: '30005', city: 'Alpharetta', year_min: 1995, year_max: 2008, year_mode: 2001, sqft: 3600, value: 780000, homes: 600 },
  { name: 'Country Club of the South', zip: '30005', city: 'Alpharetta', year_min: 1988, year_max: 2005, year_mode: 1998, sqft: 4500, value: 1200000, homes: 700 },
  { name: 'Concord Hall', zip: '30005', city: 'Alpharetta', year_min: 1998, year_max: 2006, year_mode: 2002, sqft: 3200, value: 620000, homes: 180 },
  // Gwinnett — top communities
  { name: 'Amberfield', zip: '30092', city: 'Peachtree Corners', year_min: 1995, year_max: 2002, year_mode: 1998, sqft: 2800, value: 480000, homes: 200 },
  // Cherokee
  { name: 'Woodstock Downtown District', zip: '30188', city: 'Woodstock', year_min: 2005, year_max: 2018, year_mode: 2010, sqft: 2400, value: 380000, homes: 300 },
  // DeKalb County (new territory)
  { name: 'Smoke Rise', zip: '30087', city: 'Stone Mountain', year_min: 1960, year_max: 1990, year_mode: 1975, sqft: 2800, value: 400000, homes: 1500 },
  { name: 'Briarlake Forest', zip: '30033', city: 'Decatur', year_min: 1960, year_max: 1985, year_mode: 1972, sqft: 2200, value: 480000, homes: 350 },
];

const CITIES_BY_ZIP = {
  '30004': 'Alpharetta', '30005': 'Alpharetta', '30019': 'Dacula',
  '30033': 'Decatur', '30062': 'Marietta', '30064': 'Marietta',
  '30066': 'Marietta', '30068': 'Marietta', '30087': 'Stone Mountain',
  '30092': 'Peachtree Corners', '30152': 'Kennesaw', '30188': 'Woodstock',
};

async function main() {
  console.log('=== HomeSync HOA Data Update & New Subdivisions ===\n');

  // 1. Update existing subdivisions with HOA data
  const allSubs = await (await fetch(`${API}/subdivisions`)).json();
  const subsByName = {};
  allSubs.forEach(s => { subsByName[s.name] = s; });

  let updated = 0;
  for (const item of HOA_UPDATES) {
    const sub = subsByName[item.name];
    if (!sub) {
      console.log(`  SKIP (not found): ${item.name}`);
      continue;
    }
    const res = await fetch(`${API}/subdivisions/${sub.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.updates),
    });
    if (res.ok) {
      console.log(`  UPDATE ${item.name}: ${Object.keys(item.updates).join(', ')}`);
      updated++;
    } else {
      console.log(`  ERROR updating ${item.name}: ${res.status}`);
    }
  }
  console.log(`\nUpdated ${updated} subdivisions with HOA data\n`);

  // 2. Add new subdivisions via property import
  const existingNames = new Set(allSubs.map(s => s.name));
  let totalImported = 0;
  let parcelBase = 700;

  for (const sub of NEW_SUBS) {
    if (existingNames.has(sub.name)) {
      console.log(`  SKIP (exists): ${sub.name}`);
      continue;
    }

    const count = Math.min(sub.homes, 60);
    const city = sub.city || CITIES_BY_ZIP[sub.zip] || 'Atlanta';
    const headers = 'Parcel ID,Location Address,City,Zip,Subdivision,Owner Name,Year Built,Living Area,Bedrooms,Bathrooms,Assessed Value,Lot Size';
    const rows = [];

    for (let i = 0; i < count; i++) {
      const yearBuilt = sub.year_min + rand(0, sub.year_max - sub.year_min);
      const sqft = sub.sqft + rand(-600, 600);
      const value = Math.round(sub.value * (0.7 + Math.random() * 0.6));
      const beds = sqft < 2200 ? 3 : sqft < 3200 ? rand(3, 4) : rand(4, 5);
      const baths = beds <= 3 ? pick([2, 2.5]) : pick([2.5, 3, 3.5]);
      const pid = `${String(parcelBase).padStart(3,'0')}-${String(Math.floor(i/100)+1).padStart(3,'0')}-${String((i%100)+1).padStart(3,'0')}`;
      rows.push(`${pid},${rand(1000,9999)} ${pick(ROAD_NAMES)} ${pick(ROAD_TYPES)},${city},${sub.zip},${sub.name},${pick(FIRST_NAMES)} ${pick(LAST_NAMES)},${yearBuilt},${Math.max(1200,sqft)},${beds},${baths},${value},${(0.15+Math.random()*0.6).toFixed(2)}`);
    }

    parcelBase++;
    const csvText = [headers, ...rows].join('\n');
    const mappings = {
      'Parcel ID': 'parcel_id', 'Location Address': 'address', 'City': 'city',
      'Zip': 'zip', 'Subdivision': 'subdivision', 'Owner Name': 'owner_name',
      'Year Built': 'year_built', 'Living Area': 'square_footage',
      'Bedrooms': 'bedrooms', 'Bathrooms': 'bathrooms',
      'Assessed Value': 'assessed_value', 'Lot Size': 'lot_size_acres',
    };

    const res = await fetch(`${API}/properties/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvText, mappings }),
    });

    if (res.ok) {
      const result = await res.json();
      console.log(`  IMPORT ${sub.name} (${sub.zip} ${city}): ${result.imported} properties`);
      totalImported += result.imported;
    } else {
      console.log(`  ERROR: ${sub.name}: ${res.status}`);
    }
  }
  console.log(`\nNew properties imported: ${totalImported}`);

  // 3. Recalculate urgency
  console.log('\nRecalculating urgency scores...');
  const recalcRes = await fetch(`${API}/maintenance/recalculate-all`, { method: 'POST' });
  if (recalcRes.ok) {
    const data = await recalcRes.json();
    console.log(`Updated ${data.updated} subdivisions`);
  }

  // 4. Final stats
  const finalSubs = await (await fetch(`${API}/subdivisions`)).json();
  const finalProps = await (await fetch(`${API}/properties?limit=1&page=1`)).json();
  const withMgmt = finalSubs.filter(s => s.hoa_management_company).length;
  const withContact = finalSubs.filter(s => s.hoa_contact_email || s.hoa_contact_phone).length;
  const zips = [...new Set(finalSubs.map(s => s.zip))].sort();

  console.log(`\n=== Final Stats ===`);
  console.log(`Properties: ${finalProps.pagination.total}`);
  console.log(`Subdivisions: ${finalSubs.length}`);
  console.log(`  With management company: ${withMgmt}`);
  console.log(`  With contact info (email/phone): ${withContact}`);
  console.log(`ZIP codes (${zips.length}): ${zips.join(', ')}`);
}

main().catch(console.error);
