#!/usr/bin/env node
// Phase 2: Add new Atlanta-area subdivisions by importing properties for them,
// then recalculate all urgency scores.

const API = 'http://localhost:3001/api';

const FIRST_NAMES = ['James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','David','Elizabeth','William','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Christopher','Karen','Charles','Lisa','Daniel','Nancy','Matthew','Betty','Anthony','Margaret','Mark','Sandra','Donald','Ashley','Steven','Dorothy','Andrew','Kimberly','Paul','Emily','Joshua','Donna','Kenneth','Michelle','Kevin','Carol','Brian','Amanda','George','Melissa','Timothy','Deborah','Ronald','Stephanie','Edward','Rebecca','Jason','Sharon','Jeffrey','Laura','Ryan','Cynthia'];
const LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Thompson','White','Harris','Clark','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts','Phillips','Evans','Turner','Parker','Cruz','Edwards','Collins','Reyes','Stewart','Morris','Murphy','Cook','Rogers','Morgan','Cooper','Peterson','Bailey','Reed','Kelly','Howard','Patel','Sharma','Mueller','Colombo','Singh','Weber'];
const ROAD_TYPES = ['Rd','Dr','Ln','Way','Ct','Pl','Cir','Blvd','Trl','Pass','Run'];
const ROAD_NAMES = ['Oak','Maple','Pine','Cedar','Birch','Walnut','Hickory','Magnolia','Dogwood','Peachtree','Holly','Laurel','Willow','Chestnut','Poplar','Sycamore','Summit','Ridge','Valley','Creek','Lake','Brook','Spring','Meadow','Forest','Hill','Stone','Crystal','Silver','Golden','Falcon','Eagle','Hawk','Cardinal','Heron','Swan'];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }

const CITIES_BY_ZIP = {
  '30004': 'Alpharetta', '30019': 'Dacula', '30062': 'Marietta',
  '30064': 'Marietta', '30066': 'Marietta', '30068': 'Marietta',
  '30092': 'Peachtree Corners', '30115': 'Canton', '30152': 'Kennesaw',
  '30188': 'Woodstock',
};

const NEW_SUBS = [
  // Cobb County
  { name: 'Lost Mountain Estates', zip: '30152', year_min: 1995, year_max: 2008, year_mode: 2001, sqft: 3000, value: 480000, homes: 250 },
  { name: 'Kennesley', zip: '30152', year_min: 2000, year_max: 2010, year_mode: 2005, sqft: 2800, value: 440000, homes: 180 },
  { name: 'Harrison Park', zip: '30064', year_min: 1998, year_max: 2006, year_mode: 2002, sqft: 2600, value: 410000, homes: 200 },
  { name: 'Chestnut Springs', zip: '30066', year_min: 1996, year_max: 2004, year_mode: 2000, sqft: 2900, value: 460000, homes: 160 },
  { name: 'Lassiter Landing', zip: '30062', year_min: 1993, year_max: 2002, year_mode: 1998, sqft: 3200, value: 550000, homes: 120 },
  { name: 'Indian Hills Country Club', zip: '30068', year_min: 1970, year_max: 1985, year_mode: 1978, sqft: 2400, value: 520000, homes: 350 },
  { name: 'Walton High Estates', zip: '30062', year_min: 1985, year_max: 1995, year_mode: 1990, sqft: 2800, value: 580000, homes: 200 },
  // Gwinnett County
  { name: 'Hamilton Mill', zip: '30019', year_min: 1997, year_max: 2012, year_mode: 2003, sqft: 3100, value: 450000, homes: 3500 },
  { name: 'Archer Ridge', zip: '30019', year_min: 2000, year_max: 2008, year_mode: 2004, sqft: 2700, value: 390000, homes: 180 },
  { name: 'Peachtree Corners South', zip: '30092', year_min: 1978, year_max: 1990, year_mode: 1984, sqft: 2500, value: 420000, homes: 280 },
  { name: 'Berkeley Hills', zip: '30092', year_min: 1975, year_max: 1988, year_mode: 1982, sqft: 2600, value: 450000, homes: 220 },
  // Cherokee County
  { name: 'Governors Preserve', zip: '30115', year_min: 2002, year_max: 2015, year_mode: 2007, sqft: 3400, value: 520000, homes: 300 },
  { name: 'Highland Gate', zip: '30188', year_min: 1999, year_max: 2010, year_mode: 2004, sqft: 3000, value: 460000, homes: 250 },
  // North Fulton
  { name: 'Crabapple Station', zip: '30004', year_min: 2000, year_max: 2010, year_mode: 2005, sqft: 3100, value: 620000, homes: 150 },
  { name: 'Cogburn Crossing', zip: '30004', year_min: 1998, year_max: 2006, year_mode: 2002, sqft: 3300, value: 680000, homes: 200 },
  { name: 'Cambridge High District', zip: '30004', year_min: 2001, year_max: 2012, year_mode: 2006, sqft: 3400, value: 710000, homes: 180 },
];

async function main() {
  console.log('=== Phase 2: New Atlanta-Area Subdivisions ===\n');

  // Check what exists
  const existRes = await fetch(`${API}/subdivisions`);
  const existing = await existRes.json();
  const existingNames = new Set(existing.map(s => s.name));

  let totalImported = 0;
  let parcelBase = 500;

  for (const sub of NEW_SUBS) {
    if (existingNames.has(sub.name)) {
      console.log(`  SKIP (exists): ${sub.name}`);
      continue;
    }

    const count = Math.min(sub.homes, 60);
    const city = CITIES_BY_ZIP[sub.zip] || 'Atlanta';

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
      console.log(`  IMPORT ${sub.name} (${sub.zip}): ${result.imported} properties`);
      totalImported += result.imported;
    } else {
      console.log(`  ERROR: ${sub.name}: ${res.status}`);
    }
  }

  console.log(`\nNew properties imported: ${totalImported}`);

  // Recalculate ALL urgency scores
  console.log('\nRecalculating all urgency scores...');
  const recalcRes = await fetch(`${API}/maintenance/recalculate-all`, { method: 'POST' });
  if (recalcRes.ok) {
    const data = await recalcRes.json();
    console.log(`Updated ${data.updated} subdivisions`);
  } else {
    console.log(`ERROR: recalculate returned ${recalcRes.status}`);
  }

  // Final stats
  const finalSubs = await fetch(`${API}/subdivisions`);
  const finalSubsData = await finalSubs.json();
  const finalProps = await fetch(`${API}/properties?limit=1&page=1`);
  const finalPropsData = await finalProps.json();
  const withUrgency = finalSubsData.filter(s => s.maintenance_urgency_score != null).length;
  const zips = [...new Set(finalSubsData.map(s => s.zip))].sort();

  console.log(`\n=== Final Stats ===`);
  console.log(`Properties: ${finalPropsData.pagination.total}`);
  console.log(`Subdivisions: ${finalSubsData.length} (${withUrgency} with urgency scores)`);
  console.log(`ZIP codes (${zips.length}): ${zips.join(', ')}`);
}

main().catch(console.error);
