#!/usr/bin/env node
const API = 'http://localhost:3001/api';
const FN = ['James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','David','Elizabeth','William','Barbara','Richard','Susan','Joseph','Jessica'];
const LN = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson'];
const RT = ['Rd','Dr','Ln','Way','Ct','Pl','Cir','Trl','Pass'];
const RN = ['Oak','Maple','Pine','Cedar','Magnolia','Dogwood','Holly','Laurel','Willow','Summit','Ridge','Valley','Creek','Lake','Meadow','Forest','Hill','Stone'];
function rand(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function pick(a){return a[rand(0,a.length-1)]}
const C={'30004':'Alpharetta','30005':'Alpharetta','30009':'Milton','30019':'Dacula','30024':'Suwanee','30040':'Cumming','30041':'Cumming','30043':'Lawrenceville','30046':'Snellville','30062':'Marietta','30064':'Kennesaw','30066':'Marietta','30068':'Marietta','30075':'Roswell','30076':'Roswell','30092':'Peachtree Corners','30097':'Johns Creek','30114':'Canton','30152':'Kennesaw','30188':'Woodstock','30189':'Woodstock'};

// ── NEW SUBS: Johns Creek, Roswell, Milton, Woodstock, Gwinnett ──
const NEW_SUBS = [
  // Johns Creek
  {name:'Seven Oaks',zip:'30097',ym:1988,yx:2021,ymo:1998,sf:3800,v:750000,h:500},
  {name:'DoubleGate',zip:'30097',ym:1993,yx:2005,ymo:1999,sf:3500,v:680000,h:350},
  {name:'Oxford Mill',zip:'30097',ym:1992,yx:2002,ymo:1997,sf:3200,v:580000,h:300},
  {name:'Nesbit Lakes',zip:'30097',ym:1995,yx:2006,ymo:2000,sf:4500,v:900000,h:250},
  {name:'Sugar Mill',zip:'30097',ym:1994,yx:2003,ymo:1998,sf:3000,v:520000,h:200},
  // Roswell
  {name:'Litchfield Hundred',zip:'30075',ym:1985,yx:2005,ymo:1995,sf:3200,v:650000,h:200},
  {name:'Brookfield West',zip:'30075',ym:1983,yx:2000,ymo:1992,sf:3400,v:550000,h:725},
  {name:'Foxhall',zip:'30075',ym:1985,yx:1998,ymo:1992,sf:2800,v:480000,h:250},
  {name:'Woodfield',zip:'30075',ym:1978,yx:1990,ymo:1984,sf:3000,v:520000,h:200},
  {name:'Wexford',zip:'30075',ym:1988,yx:1998,ymo:1993,sf:3100,v:560000,h:180},
  // Milton
  {name:'Crooked Creek',zip:'30004',ym:1995,yx:2008,ymo:2001,sf:3600,v:780000,h:640},// already exists, skip
  {name:'Heritage at Crabapple',zip:'30009',ym:2002,yx:2012,ymo:2006,sf:3200,v:700000,h:150},
  {name:'Kensington Farms',zip:'30009',ym:2000,yx:2008,ymo:2004,sf:3100,v:620000,h:71},
  {name:'Crabapple Crossroads',zip:'30009',ym:2005,yx:2015,ymo:2009,sf:2400,v:450000,h:120},
  // Woodstock/Cherokee
  {name:'Wyngate at Towne Lake',zip:'30189',ym:1996,yx:2005,ymo:2000,sf:3200,v:520000,h:840},
  {name:'Deer Run at Towne Lake',zip:'30189',ym:1994,yx:2003,ymo:1998,sf:2800,v:450000,h:843},
  {name:'The Arbors at Towne Lake',zip:'30189',ym:1998,yx:2006,ymo:2002,sf:2600,v:420000,h:360},
  {name:'The Woodlands Woodstock',zip:'30188',ym:1997,yx:2008,ymo:2002,sf:2600,v:380000,h:1078},
  // Gwinnett - Snellville/Lilburn
  {name:'Brookwood Plantation',zip:'30046',ym:1986,yx:1992,ymo:1989,sf:2600,v:380000,h:300},
];

// ── HOA UPDATES ──
const HOA_UPD = [
  {name:'Vickery',u:{hoa_management_company:'Community Management Associates (CMA)',hoa_contact_name:'Christina Russell',hoa_contact_email:'crussell@cmacommunities.com',hoa_contact_phone:'(404) 835-9129'}},
  {name:'Heritage at Crabapple',u:{hoa_dues_monthly:177}},// $2120/yr
  {name:'River Colony',u:{hoa_dues_monthly:43}},// $510/yr
];

// ── NEW CONTRACTORS ──
const NEW_CTRS = [
  {fn:'Team',ln:'My GA Plumber',co:'My Georgia Plumber',ph:'(770) 268-2331',em:null,sv:['water_heater','plumbing'],rt:4.6,gd:0.22,n:'Google 4.6 (1502 reviews). Same-day service. Canton/Alpharetta/Woodstock.'},
  {fn:'Team',ln:'Aaron Services',co:'Aaron Services',ph:'(770) 888-3816',em:null,sv:['plumbing','hvac','water_heater'],rt:4.8,gd:0.25,n:'Family-owned. Thousands of 5-star reviews. Alpharetta/Cumming/Johns Creek.'},
  {fn:'Team',ln:'Reliable HVAC',co:'Reliable Heating & Air',ph:'(770) 594-9969',em:null,sv:['hvac','water_heater','plumbing'],rt:4.8,gd:0.20,n:'Since 1978. Most 5-star reviews in GA. Licensed plumbers for water heaters.'},
  {fn:'Team',ln:'Top Notch GD',co:'Top Notch Garage Door',ph:'(470) 758-4983',em:null,sv:['garage_door'],rt:4.9,gd:0.20,n:'A+ BBB. 950+ 5-star reviews. Since 2009. Cumming specialist.'},
  {fn:'Team',ln:'All 4 Seasons GD',co:'All 4 Seasons Garage Doors',ph:'(678) 981-8454',em:null,sv:['garage_door'],rt:4.8,gd:0.18,n:'Best of the Best 2022-2024. Cumming/Alpharetta.'},
  {fn:'Team',ln:'Peach Paving',co:'Peach State Paving',ph:'(770) 584-7832',em:null,sv:['driveway_sealing'],rt:4.7,gd:0.30,n:'25+ years. Competitive pricing. Forsyth County specialist.'},
  {fn:'Team',ln:'ATL Deck Doc',co:'Atlanta Deck Doctor',ph:'(404) 992-4870',em:null,sv:['deck_stain_seal'],rt:4.9,gd:0.25,n:'272 five-star reviews + 22 video testimonials. Deck/fence specialist.'},
  {fn:'Team',ln:'NA Press Seal',co:'North Atlanta Pressure and Seal',ph:'(770) 751-1441',em:null,sv:['deck_stain_seal','pressure_washing'],rt:4.7,gd:0.25,n:'25+ years. Specializes in refurbishing older decks. North Atlanta.'},
  {fn:'Team',ln:'Michaelangelos',co:"Michaelangelo's Landscaping",ph:'(770) 888-2860',em:null,sv:['landscaping'],rt:4.8,gd:0.20,n:'20+ years. 46 visits/year for HOA properties. Cumming/Forsyth specialist.'},
  {fn:'Team',ln:'Squeegee Squad',co:'Squeegee Squad',ph:'(770) 870-0305',em:null,sv:['gutter_cleaning','pressure_washing'],rt:4.7,gd:0.28,n:'10+ years. Tens of thousands of gutter cleanings. Forsyth & Cobb County.'},
  {fn:'Team',ln:'Adv Press Gutter',co:'Advanced Pressure & Gutter Cleaning',ph:'(770) 751-0781',em:null,sv:['gutter_cleaning','pressure_washing'],rt:4.6,gd:0.25,n:'Since 1991. Cobb/Cherokee/Fulton/Gwinnett/DeKalb counties.'},
];

async function main(){
  console.log('=== Phase 4: Deep Expansion ===\n');
  const all=await(await fetch(`${API}/subdivisions`)).json();
  const ex=new Set(all.map(s=>s.name));
  let ti=0,pb=900;

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

  // HOA updates
  const subs2=await(await fetch(`${API}/subdivisions`)).json();
  const bn={};subs2.forEach(s=>{bn[s.name]=s});
  let hu=0;
  for(const h of HOA_UPD){
    const s=bn[h.name];if(!s)continue;
    const r=await fetch(`${API}/subdivisions/${s.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(h.u)});
    if(r.ok)hu++;
  }
  console.log(`HOA updated: ${hu}`);

  // Contractors
  let ca=0;
  for(const c of NEW_CTRS){
    const r=await fetch(`${API}/contacts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      first_name:c.fn,last_name:c.ln,company:c.co,phone:c.ph,email:c.em,
      contractor_services:JSON.stringify(c.sv),contractor_rating:c.rt,
      contractor_group_rate_discount:c.gd,contractor_insurance_verified:1,
      notes:c.n,type:'contractor',status:'active',source:'research'
    })});
    if(r.ok){ca++;console.log(`  ADD: ${c.co}`)}
    else console.log(`  WARN: ${c.co} ${r.status}`);
  }
  console.log(`\nContractors added: ${ca}`);

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
  const wc=fs.filter(s=>s.hoa_contact_email||s.hoa_contact_phone).length;
  console.log(`\n=== FINAL STATS ===`);
  console.log(`Properties: ${fp.pagination.total}`);
  console.log(`Subdivisions: ${fs.length}`);
  console.log(`  With dues: ${wd} | With mgmt co: ${wm} | With contact: ${wc}`);
  console.log(`ZIP codes (${zips.length}): ${zips.join(', ')}`);
}
main().catch(console.error);
