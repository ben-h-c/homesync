#!/usr/bin/env node
const API = 'http://localhost:3001/api';
const FN=['James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','David','Elizabeth','William','Barbara','Richard','Susan'];
const LN=['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Wilson','Anderson','Thomas','Taylor'];
const RT=['Rd','Dr','Ln','Way','Ct','Pl','Cir','Trl','Pass'];
const RN=['Oak','Maple','Pine','Cedar','Magnolia','Dogwood','Holly','Laurel','Willow','Summit','Ridge','Valley','Creek','Lake','Meadow','Forest'];
function rand(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function pick(a){return a[rand(0,a.length-1)]}
const C={'30004':'Alpharetta','30009':'Milton','30017':'Grayson','30022':'Johns Creek','30024':'Suwanee','30039':'Snellville','30040':'Cumming','30041':'Cumming','30043':'Lawrenceville','30046':'Snellville','30068':'Marietta','30075':'Roswell','30076':'Roswell','30078':'Snellville','30092':'Peachtree Corners','30097':'Johns Creek','30102':'Acworth','30115':'Canton','30144':'Kennesaw','30188':'Woodstock','30189':'Woodstock'};

const NEW_SUBS = [
  // Roswell — massive communities
  {name:'Horseshoe Bend',zip:'30076',ym:1980,yx:1995,ymo:1988,sf:3800,v:825000,h:1200,dues:446},
  {name:"Martin's Landing",zip:'30068',ym:1977,yx:2000,ymo:1988,sf:2800,v:500000,h:1965,dues:286},
  {name:'Willow Springs Country Club',zip:'30075',ym:1965,yx:2021,ymo:1982,sf:3200,v:650000,h:700,dues:293},
  {name:'Saddle Creek',zip:'30076',ym:1970,yx:2008,ymo:1990,sf:3400,v:770000,h:500,dues:37},
  {name:'Barrington Farms',zip:'30076',ym:1978,yx:2025,ymo:1995,sf:3600,v:880000,h:470,dues:6},
  // Johns Creek — premium communities
  {name:'Medlock Bridge',zip:'30097',ym:1995,yx:2005,ymo:1997,sf:3800,v:815000,h:640,dues:111},
  {name:'St. Ives Country Club',zip:'30022',ym:1989,yx:2010,ymo:1998,sf:4800,v:1350000,h:800,dues:300},
  {name:'Rivermont',zip:'30022',ym:1980,yx:2005,ymo:1995,sf:2800,v:358000,h:300,dues:319},
  {name:'Thornhill',zip:'30097',ym:1992,yx:2005,ymo:1998,sf:3400,v:700000,h:200,dues:107},
  // Woodstock/Cherokee — large Towne Lake communities
  {name:'Towne Lake Hills',zip:'30189',ym:1996,yx:2015,ymo:2003,sf:3400,v:780000,h:875,dues:47},
  {name:'Brookshire',zip:'30189',ym:2001,yx:2004,ymo:2002,sf:2800,v:462000,h:624,dues:62},
  {name:'Bradshaw Farm',zip:'30188',ym:1995,yx:2001,ymo:1998,sf:3200,v:728000,h:621,dues:44},
  {name:'Harmony on the Lakes',zip:'30115',ym:2004,yx:2024,ymo:2010,sf:3000,v:535000,h:600,dues:61},
  {name:'Legacy Park',zip:'30144',ym:2002,yx:2015,ymo:2008,sf:2800,v:440000,h:500,dues:66},
  // East Cobb — huge established communities
  {name:'EastHampton',zip:'30068',ym:1982,yx:1998,ymo:1990,sf:3200,v:674000,h:426,dues:83},
  {name:'Pinetree Country Club',zip:'30144',ym:1962,yx:2008,ymo:1985,sf:2800,v:450000,h:1000,dues:50},
  {name:'Chestnut Hill',zip:'30102',ym:1987,yx:2000,ymo:1993,sf:2800,v:334000,h:309,dues:43},
  // Gwinnett — Snellville/Peachtree Corners
  {name:'Peachtree Station',zip:'30092',ym:1979,yx:1987,ymo:1983,sf:2600,v:660000,h:717,dues:50},
  {name:'Bright Water',zip:'30078',ym:1998,yx:2002,ymo:2000,sf:3200,v:600000,h:200,dues:70},
  {name:'Norris Lake',zip:'30039',ym:1980,yx:2005,ymo:1995,sf:2400,v:297000,h:200,dues:40},
  // Johns Creek premium
  {name:'Seven Oaks',zip:'30097',ym:1988,yx:2021,ymo:1998,sf:3800,v:1050000,h:642,dues:146},// update existing
  // Forsyth — Polo Golf
  {name:'Polo Golf and Country Club',zip:'30040',ym:1976,yx:2026,ymo:2000,sf:3400,v:750000,h:800,dues:145},
];

// HOA updates for EXISTING subdivisions with newly found data
const HOA_UPD = [
  {name:'Seven Oaks',u:{hoa_dues_monthly:146,total_homes:642}},
  {name:'Indian Hills Country Club',u:{hoa_dues_monthly:35,total_homes:1680}},
  {name:'Crooked Creek',u:{hoa_management_company:'Self-managed HOA',hoa_website:'https://www.crookedcreekhoa.org',total_homes:640}},
  {name:'James Creek',u:{hoa_dues_monthly:72}},// $862/yr
  {name:'Aberdeen',u:{hoa_dues_monthly:50}},// $600/yr
  {name:'Creekstone Estates',u:{total_homes:342}},
  {name:'Eagle Watch',u:{total_homes:1300}},
  {name:'The Woodlands Woodstock',u:{hoa_dues_monthly:83}},// $1000/yr
];

async function main(){
  console.log('=== Phase 5: Major Expansion ===\n');
  const all=await(await fetch(`${API}/subdivisions`)).json();
  const ex=new Set(all.map(s=>s.name));
  let ti=0,pb=950;

  for(const s of NEW_SUBS){
    if(ex.has(s.name)){console.log(`  SKIP: ${s.name}`);continue}
    const ct=Math.min(s.h,60),city=C[s.zip]||'Atlanta';
    const hdr='Parcel ID,Location Address,City,Zip,Subdivision,Owner Name,Year Built,Living Area,Bedrooms,Bathrooms,Assessed Value,Lot Size';
    const rows=[];
    for(let i=0;i<ct;i++){
      const yb=s.ym+rand(0,s.yx-s.ym),sf=s.sf+rand(-600,600),val=Math.round(s.v*(0.7+Math.random()*0.6));
      const bd=sf<2200?3:sf<3200?rand(3,4):rand(4,5),ba=bd<=3?pick([2,2.5]):pick([2.5,3,3.5]);
      const pid=`${String(pb).padStart(3,'0')}-${String(Math.floor(i/100)+1).padStart(3,'0')}-${String((i%100)+1).padStart(3,'0')}`;
      rows.push(`${pid},${rand(1000,9999)} ${pick(RN)} ${pick(RT)},${city},${s.zip},${s.name},${pick(FN)} ${pick(LN)},${yb},${Math.max(1200,sf)},${bd},${ba},${val},${(0.15+Math.random()*0.6).toFixed(2)}`);
    }
    pb++;
    const csv=[hdr,...rows].join('\n');
    const map={'Parcel ID':'parcel_id','Location Address':'address','City':'city','Zip':'zip','Subdivision':'subdivision','Owner Name':'owner_name','Year Built':'year_built','Living Area':'square_footage','Bedrooms':'bedrooms','Bathrooms':'bathrooms','Assessed Value':'assessed_value','Lot Size':'lot_size_acres'};
    const r=await fetch(`${API}/properties/import`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({csvText:csv,mappings:map})});
    if(r.ok){const d=await r.json();console.log(`  IMPORT ${s.name} (${s.zip} ${city}): ${d.imported}`);ti+=d.imported}
    else console.log(`  ERR ${s.name}: ${r.status}`);
  }
  console.log(`\nProperties imported: ${ti}`);

  // Update HOA dues for new subs
  const subs2=await(await fetch(`${API}/subdivisions`)).json();
  const bn={};subs2.forEach(s=>{bn[s.name]=s});
  let du=0;
  for(const s of NEW_SUBS){
    const sub=bn[s.name];if(!sub||!s.dues)continue;
    await fetch(`${API}/subdivisions/${sub.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({hoa_dues_monthly:s.dues})});
    du++;
  }
  // Update existing subs with new data
  for(const h of HOA_UPD){
    const s=bn[h.name];if(!s)continue;
    await fetch(`${API}/subdivisions/${s.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(h.u)});
    du++;
  }
  console.log(`HOA/dues updated: ${du}`);

  // Recalculate
  console.log('\nRecalculating...');
  const rc=await fetch(`${API}/maintenance/recalculate-all`,{method:'POST'});
  if(rc.ok){const d=await rc.json();console.log(`Updated ${d.updated} subdivisions`)}

  // Stats
  const fs=await(await fetch(`${API}/subdivisions`)).json();
  const fp=await(await fetch(`${API}/properties?limit=1&page=1`)).json();
  const zips=[...new Set(fs.map(s=>s.zip))].sort();
  const wd=fs.filter(s=>s.hoa_dues_monthly).length;
  const wm=fs.filter(s=>s.hoa_management_company).length;
  const totalHomes=fs.reduce((sum,s)=>sum+(s.total_homes||0),0);
  console.log(`\n=== FINAL STATS ===`);
  console.log(`Properties in DB: ${fp.pagination.total}`);
  console.log(`Subdivisions: ${fs.length}`);
  console.log(`Total homes represented: ${totalHomes.toLocaleString()}`);
  console.log(`  With dues: ${wd} | With mgmt co: ${wm}`);
  console.log(`ZIP codes (${zips.length}): ${zips.join(', ')}`);
}
main().catch(console.error);
