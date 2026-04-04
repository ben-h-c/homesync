#!/usr/bin/env node
// Sweep: generate property data for subdivisions missing it,
// and add new Atlanta-area subdivisions with properties.

const API = 'http://localhost:3001/api';

// ── New subdivisions to add (not already in the DB) ─────────────────
const NEW_SUBDIVISIONS = [
  // Cobb County
  { name: 'West Cobb / Lost Mountain', zip: '30152', total_homes: 250, year_built_min: 1995, year_built_max: 2008, year_built_mode: 2001, avg_square_footage: 3000, avg_assessed_value: 480000, hoa_name: 'Lost Mountain Estates HOA', pipeline_stage: 'research', lat: 33.96, lng: -84.68 },
  { name: 'Kennesley', zip: '30152', total_homes: 180, year_built_min: 2000, year_built_max: 2010, year_built_mode: 2005, avg_square_footage: 2800, avg_assessed_value: 440000, hoa_name: 'Kennesley HOA', pipeline_stage: 'research', lat: 33.97, lng: -84.67 },
  { name: 'Harrison Park', zip: '30064', total_homes: 200, year_built_min: 1998, year_built_max: 2006, year_built_mode: 2002, avg_square_footage: 2600, avg_assessed_value: 410000, hoa_name: 'Harrison Park HOA', pipeline_stage: 'research', lat: 33.95, lng: -84.60 },
  { name: 'Chestnut Springs', zip: '30066', total_homes: 160, year_built_min: 1996, year_built_max: 2004, year_built_mode: 2000, avg_square_footage: 2900, avg_assessed_value: 460000, hoa_name: 'Chestnut Springs HOA', pipeline_stage: 'research', lat: 33.99, lng: -84.53 },
  { name: 'Lassiter Landing', zip: '30062', total_homes: 120, year_built_min: 1993, year_built_max: 2002, year_built_mode: 1998, avg_square_footage: 3200, avg_assessed_value: 550000, hoa_name: 'Lassiter Landing HOA', pipeline_stage: 'research', lat: 34.03, lng: -84.47 },
  // East Cobb
  { name: 'Indian Hills', zip: '30068', total_homes: 350, year_built_min: 1970, year_built_max: 1985, year_built_mode: 1978, avg_square_footage: 2400, avg_assessed_value: 520000, hoa_name: 'Indian Hills Civic Association', pipeline_stage: 'research', lat: 33.98, lng: -84.42 },
  { name: 'Walton High Estates', zip: '30062', total_homes: 200, year_built_min: 1985, year_built_max: 1995, year_built_mode: 1990, avg_square_footage: 2800, avg_assessed_value: 580000, hoa_name: 'Walton High Estates HOA', pipeline_stage: 'research', lat: 34.01, lng: -84.44 },
  // Gwinnett County (more)
  { name: 'Hamilton Mill', zip: '30019', total_homes: 3500, year_built_min: 1997, year_built_max: 2012, year_built_mode: 2003, avg_square_footage: 3100, avg_assessed_value: 450000, hoa_name: 'Hamilton Mill Community Association', pipeline_stage: 'research', lat: 34.00, lng: -83.88 },
  { name: 'Archer Ridge', zip: '30043', total_homes: 180, year_built_min: 2000, year_built_max: 2008, year_built_mode: 2004, avg_square_footage: 2700, avg_assessed_value: 390000, hoa_name: 'Archer Ridge HOA', pipeline_stage: 'research', lat: 34.01, lng: -84.05 },
  { name: 'Peachtree Corners South', zip: '30092', total_homes: 280, year_built_min: 1978, year_built_max: 1990, year_built_mode: 1984, avg_square_footage: 2500, avg_assessed_value: 420000, hoa_name: 'Peachtree Corners South HOA', pipeline_stage: 'research', lat: 33.97, lng: -84.22 },
  { name: 'Berkeley Hills', zip: '30092', total_homes: 220, year_built_min: 1975, year_built_max: 1988, year_built_mode: 1982, avg_square_footage: 2600, avg_assessed_value: 450000, hoa_name: 'Berkeley Hills HOA', pipeline_stage: 'research', lat: 33.96, lng: -84.23 },
  // Cherokee County (more)
  { name: 'Governors Preserve', zip: '30115', total_homes: 300, year_built_min: 2002, year_built_max: 2015, year_built_mode: 2007, avg_square_footage: 3400, avg_assessed_value: 520000, hoa_name: 'Governors Preserve HOA', pipeline_stage: 'research', lat: 34.22, lng: -84.47 },
  { name: 'Highland Gate', zip: '30188', total_homes: 250, year_built_min: 1999, year_built_max: 2010, year_built_mode: 2004, avg_square_footage: 3000, avg_assessed_value: 460000, hoa_name: 'Highland Gate HOA', pipeline_stage: 'research', lat: 34.10, lng: -84.50 },
  // North Fulton (more)
  { name: 'Crabapple Station', zip: '30004', total_homes: 150, year_built_min: 2000, year_built_max: 2010, year_built_mode: 2005, avg_square_footage: 3100, avg_assessed_value: 620000, hoa_name: 'Crabapple Station HOA', pipeline_stage: 'research', lat: 34.07, lng: -84.36 },
  { name: 'Cogburn Crossing', zip: '30004', total_homes: 200, year_built_min: 1998, year_built_max: 2006, year_built_mode: 2002, avg_square_footage: 3300, avg_assessed_value: 680000, hoa_name: 'Cogburn Crossing HOA', pipeline_stage: 'research', lat: 34.08, lng: -84.32 },
  { name: 'Cambridge High District', zip: '30004', total_homes: 180, year_built_min: 2001, year_built_max: 2012, year_built_mode: 2006, avg_square_footage: 3400, avg_assessed_value: 710000, hoa_name: 'Cambridge HOA', pipeline_stage: 'research', lat: 34.09, lng: -84.30 },
];

// ── Helpers ──────────────────────────────────────────────────────────
const FIRST_NAMES = ['James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','David','Elizabeth','William','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Christopher','Karen','Charles','Lisa','Daniel','Nancy','Matthew','Betty','Anthony','Margaret','Mark','Sandra','Donald','Ashley','Steven','Dorothy','Andrew','Kimberly','Paul','Emily','Joshua','Donna','Kenneth','Michelle','Kevin','Carol','Brian','Amanda','George','Melissa','Timothy','Deborah','Ronald','Stephanie','Edward','Rebecca','Jason','Sharon','Jeffrey','Laura','Ryan','Cynthia','Jacob','Kathleen','Gary','Amy','Nicholas','Angela','Eric','Shirley','Jonathan','Anna','Stephen','Brenda','Larry','Pamela','Justin','Emma','Scott','Nicole','Brandon','Helen','Benjamin','Samantha','Samuel','Katherine','Raymond','Christine','Gregory','Debra','Frank','Rachel','Alexander','Carolyn','Patrick','Janet','Jack','Catherine','Dennis','Maria','Jerry','Heather','Tyler','Diane','Aaron','Ruth','Jose','Julie','Nathan','Olivia','Henry','Joyce','Douglas','Virginia','Peter','Victoria','Zachary','Kelly','Kyle','Lauren','Noah','Christina','Ethan','Joan','Jeremy','Evelyn','Walter','Judith','Christian','Megan','Keith','Andrea','Roger','Cheryl','Terry','Hannah','Austin','Jacqueline','Sean','Martha','Gerald','Gloria','Carl','Teresa','Dylan','Ann','Harold','Sara','Jordan','Madison','Jesse','Frances','Bryan','Kathryn','Lawrence','Janice','Arthur','Jean','Gabriel','Abigail','Bruce','Alice','Albert','Judy','Willie','Sophia','Alan','Grace','Wayne','Denise','Elijah','Amber','Randy','Doris','Philip','Marilyn','Vincent','Danielle','Bobby','Beverly','Johnny','Isabella','Howard','Theresa','Eugene','Diana','Russell','Natalie','Ralph','Brittany','Roy','Charlotte','Louis','Marie','Adam','Kayla','Harry','Alexis','Joe','Lori'],
      LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts','Gomez','Phillips','Evans','Turner','Diaz','Parker','Cruz','Edwards','Collins','Reyes','Stewart','Morris','Morales','Murphy','Cook','Rogers','Gutierrez','Ortiz','Morgan','Cooper','Peterson','Bailey','Reed','Kelly','Howard','Ramos','Kim','Cox','Ward','Richardson','Watson','Brooks','Chavez','Wood','James','Bennett','Gray','Mendoza','Ruiz','Hughes','Price','Alvarez','Castillo','Sanders','Patel','Myers','Long','Ross','Foster','Jimenez','Powell','Jenkins','Perry','Russell','Sullivan','Bell','Coleman','Butler','Henderson','Barnes','Gonzales','Fisher','Vasquez','Simmons','Patterson','Jordan','Reynolds','Hamilton','Graham','Sharma','Mueller','Colombo','Torres','Reyes','Chen','Nakamura','Park','Singh','Weber','Hoffman'];

const ROAD_TYPES = ['Rd','Dr','Ln','Way','Ct','Pl','Cir','Blvd','Trl','Pass','Run','Xing','Pt','Cv'];
const ROAD_NAMES = ['Oak','Maple','Pine','Cedar','Birch','Walnut','Hickory','Magnolia','Dogwood','Peachtree','Roswell','Canton','Holly','Ivy','Laurel','Willow','Chestnut','Poplar','Sycamore','Aspen','Cherry','Elm','Spruce','Cypress','Juniper','Hemlock','Redwood','Sequoia','Summit','Ridge','Valley','Creek','Lake','River','Brook','Spring','Meadow','Forest','Hill','Mountain','Stone','Rock','Sand','Shell','Coral','Pearl','Crystal','Silver','Golden','Amber','Sapphire','Emerald','Ruby','Diamond','Sterling','Falcon','Eagle','Hawk','Dove','Robin','Lark','Cardinal','Wren','Finch','Sparrow','Blue Jay','Heron','Pelican','Swan','Crane','Raven','Osprey','Kestrel','Martin'];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }

function generateParcelId(base, i) {
  const a = String(base).padStart(3, '0');
  const b = String(Math.floor(i / 100) + 1).padStart(3, '0');
  const c = String((i % 100) + 1).padStart(3, '0');
  return `${a}-${b}-${c}`;
}

const CITIES_BY_ZIP = {
  '30004': 'Alpharetta', '30005': 'Alpharetta', '30009': 'Alpharetta',
  '30019': 'Dacula', '30024': 'Suwanee', '30028': 'Cumming',
  '30040': 'Cumming', '30041': 'Cumming', '30043': 'Lawrenceville',
  '30062': 'Marietta', '30064': 'Marietta', '30066': 'Marietta',
  '30068': 'Marietta', '30092': 'Peachtree Corners',
  '30097': 'Johns Creek', '30101': 'Acworth',
  '30114': 'Canton', '30115': 'Canton',
  '30152': 'Kennesaw', '30188': 'Woodstock', '30189': 'Woodstock',
  '30517': 'Braselton', '30518': 'Buford', '30542': 'Flowery Branch',
};

function generateProperties(sub, parcelBase) {
  // Generate a sample of properties (up to 60 for large subdivisions)
  const count = Math.min(sub.total_homes, 60);
  const properties = [];

  for (let i = 0; i < count; i++) {
    const yearSpan = (sub.year_built_max || sub.year_built_mode) - (sub.year_built_min || sub.year_built_mode);
    const yearBuilt = sub.year_built_min + rand(0, Math.max(yearSpan, 0));
    const sqft = sub.avg_square_footage + rand(-600, 600);
    const valueVariation = sub.avg_assessed_value * (0.7 + Math.random() * 0.6);
    const bedrooms = sqft < 2200 ? 3 : sqft < 3200 ? rand(3, 4) : rand(4, 5);
    const bathrooms = bedrooms <= 3 ? pick([2, 2.5]) : pick([2.5, 3, 3.5]);
    const addr = `${rand(1000, 9999)} ${pick(ROAD_NAMES)} ${pick(ROAD_TYPES)}`;
    const city = CITIES_BY_ZIP[sub.zip] || 'Cumming';

    properties.push({
      parcel_id: generateParcelId(parcelBase, i),
      address: addr,
      city,
      state: 'GA',
      zip: sub.zip,
      subdivision: sub.name,
      owner_name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      year_built: yearBuilt,
      square_footage: Math.max(1200, sqft),
      bedrooms,
      bathrooms,
      assessed_value: Math.round(valueVariation),
      lot_size_acres: +(0.15 + Math.random() * 0.6).toFixed(2),
      property_type: 'Single Family',
    });
  }
  return properties;
}

async function main() {
  console.log('=== HomeSync Atlanta Area Sweep ===\n');

  // 1. Get existing subdivisions
  const existingRes = await fetch(`${API}/subdivisions`);
  const existing = await existingRes.json();
  const existingNames = new Set(existing.map(s => s.name));

  // 2. Get existing property count per subdivision
  const propsRes = await fetch(`${API}/properties?limit=1&page=1`);
  const propsData = await propsRes.json();
  console.log(`Current: ${propsData.pagination.total} properties, ${existing.length} subdivisions\n`);

  // 3. Add new subdivisions
  let newSubsAdded = 0;
  for (const sub of NEW_SUBDIVISIONS) {
    if (existingNames.has(sub.name)) {
      console.log(`  SKIP (exists): ${sub.name}`);
      continue;
    }
    const { lat, lng, ...subData } = sub;
    const res = await fetch(`${API}/subdivisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subData),
    });
    if (res.ok) {
      console.log(`  ADD subdivision: ${sub.name} (${sub.zip}, ${sub.total_homes} homes)`);
      newSubsAdded++;
    } else {
      // Might not have POST endpoint, use alternative approach
      console.log(`  WARN: Could not add ${sub.name} via API (${res.status})`);
    }
  }
  console.log(`\nNew subdivisions added: ${newSubsAdded}`);

  // 4. Reload subdivisions list
  const reloadRes = await fetch(`${API}/subdivisions`);
  const allSubs = await reloadRes.json();

  // 5. Find subdivisions without property data (urgency is null)
  const needsProps = allSubs.filter(s => s.maintenance_urgency_score == null);
  console.log(`\nSubdivisions needing property data: ${needsProps.length}`);

  // 6. Generate and import properties
  let totalImported = 0;
  let parcelBase = 200; // Start parcel prefix high to avoid collisions

  for (const sub of needsProps) {
    const properties = generateProperties(sub, parcelBase++);

    // Build CSV
    const headers = 'Parcel ID,Location Address,City,Zip,Subdivision,Owner Name,Year Built,Living Area,Bedrooms,Bathrooms,Assessed Value,Lot Size';
    const rows = properties.map(p =>
      `${p.parcel_id},${p.address},${p.city},${p.zip},${p.subdivision},${p.owner_name},${p.year_built},${p.square_footage},${p.bedrooms},${p.bathrooms},${p.assessed_value},${p.lot_size_acres}`
    );
    const csvText = [headers, ...rows].join('\n');

    const mappings = {
      'Parcel ID': 'parcel_id',
      'Location Address': 'address',
      'City': 'city',
      'Zip': 'zip',
      'Subdivision': 'subdivision',
      'Owner Name': 'owner_name',
      'Year Built': 'year_built',
      'Living Area': 'square_footage',
      'Bedrooms': 'bedrooms',
      'Bathrooms': 'bathrooms',
      'Assessed Value': 'assessed_value',
      'Lot Size': 'lot_size_acres',
    };

    const importRes = await fetch(`${API}/properties/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvText, mappings }),
    });

    if (importRes.ok) {
      const result = await importRes.json();
      console.log(`  IMPORT ${sub.name}: ${result.imported} properties (${result.skipped} skipped, ${result.errors?.length || 0} errors)`);
      totalImported += result.imported;
    } else {
      console.log(`  ERROR importing ${sub.name}: ${importRes.status}`);
    }
  }

  console.log(`\nTotal properties imported: ${totalImported}`);

  // 7. Recalculate all urgency scores
  console.log('\nRecalculating urgency scores...');
  const recalcRes = await fetch(`${API}/maintenance/recalculate`, { method: 'POST' });
  if (recalcRes.ok) {
    const recalcData = await recalcRes.json();
    console.log(`Updated ${recalcData.updated} subdivisions`);
  } else {
    console.log(`WARN: recalculate returned ${recalcRes.status}`);
  }

  // 8. Final stats
  const finalProps = await fetch(`${API}/properties?limit=1&page=1`);
  const finalData = await finalProps.json();
  const finalSubs = await fetch(`${API}/subdivisions`);
  const finalSubsData = await finalSubs.json();
  const withUrgency = finalSubsData.filter(s => s.maintenance_urgency_score != null).length;

  console.log(`\n=== Final Stats ===`);
  console.log(`Properties: ${finalData.pagination.total}`);
  console.log(`Subdivisions: ${finalSubsData.length} (${withUrgency} with urgency scores)`);
  console.log(`ZIP codes: ${[...new Set(finalSubsData.map(s => s.zip))].sort().join(', ')}`);
}

main().catch(console.error);
