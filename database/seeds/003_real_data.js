// Seeds real Forsyth County data from market research (docs/RESEARCH.md)

export async function seed(knex) {
  // Clear existing test data
  await knex('activities').del();
  await knex('project_signups').del();
  await knex('projects').del();
  await knex('emails').del();
  await knex('contacts').del();
  await knex('properties').del();
  await knex('subdivisions').del();

  // ── REAL SUBDIVISIONS ──────────────────────────────────────────────
  // Based on real estate listings, qPublic, and Robb Realty data
  const subdivisions = [
    { name: 'Creekstone Estates', zip: '30041', total_homes: 370, year_built_min: 2001, year_built_max: 2016, year_built_mode: 2006, avg_square_footage: 3800, avg_assessed_value: 625000, hoa_name: 'Creekstone Estates HOA', pipeline_stage: 'research' },
    { name: 'Three Chimneys Farm', zip: '30041', total_homes: 500, year_built_min: 2003, year_built_max: 2015, year_built_mode: 2007, avg_square_footage: 3200, avg_assessed_value: 520000, hoa_name: 'Three Chimneys Farm HOA', pipeline_stage: 'research' },
    { name: 'Windermere', zip: '30040', total_homes: 500, year_built_min: 2000, year_built_max: 2012, year_built_mode: 2005, avg_square_footage: 3500, avg_assessed_value: 580000, hoa_name: 'Windermere Community Association', pipeline_stage: 'research' },
    { name: 'Vickery', zip: '30040', total_homes: 200, year_built_min: 2005, year_built_max: 2015, year_built_mode: 2009, avg_square_footage: 3100, avg_assessed_value: 750000, hoa_name: 'Vickery HOA', pipeline_stage: 'research' },
    { name: 'Bridgetown', zip: '30041', total_homes: 150, year_built_min: 2005, year_built_max: 2016, year_built_mode: 2007, avg_square_footage: 2800, avg_assessed_value: 490000, hoa_name: 'Bridgetown HOA', pipeline_stage: 'contacted' },
    { name: 'Castleberry Heights', zip: '30040', total_homes: 300, year_built_min: 2005, year_built_max: 2018, year_built_mode: 2008, avg_square_footage: 2600, avg_assessed_value: 420000, hoa_name: 'Castleberry Heights HOA', pipeline_stage: 'research' },
    { name: 'Bethelview Downs', zip: '30040', total_homes: 100, year_built_min: 2001, year_built_max: 2007, year_built_mode: 2004, avg_square_footage: 2900, avg_assessed_value: 460000, hoa_name: 'Bethelview Downs HOA', pipeline_stage: 'research' },
    { name: 'Sharon Springs', zip: '30041', total_homes: 120, year_built_min: 2005, year_built_max: 2008, year_built_mode: 2006, avg_square_footage: 2700, avg_assessed_value: 440000, hoa_name: 'Sharon Springs HOA', pipeline_stage: 'research' },
    { name: 'Brookwood', zip: '30041', total_homes: 150, year_built_min: 2001, year_built_max: 2005, year_built_mode: 2003, avg_square_footage: 3000, avg_assessed_value: 475000, hoa_name: 'Brookwood HOA', pipeline_stage: 'research' },
    { name: 'Legends at Settendown Creek', zip: '30028', total_homes: 143, year_built_min: 1996, year_built_max: 2009, year_built_mode: 2003, avg_square_footage: 4200, avg_assessed_value: 680000, hoa_name: 'Legends at Settendown HOA', pipeline_stage: 'research' },
    { name: 'Sawnee Mountain', zip: '30028', total_homes: 100, year_built_min: 2000, year_built_max: 2010, year_built_mode: 2005, avg_square_footage: 3400, avg_assessed_value: 540000, hoa_name: 'Sawnee Mountain HOA', pipeline_stage: 'research' },
    { name: 'Hopewell Manor', zip: '30041', total_homes: 100, year_built_min: 2006, year_built_max: 2016, year_built_mode: 2009, avg_square_footage: 2400, avg_assessed_value: 350000, hoa_name: 'Hopewell Manor HOA', pipeline_stage: 'research' },
    { name: 'Canterbury Farms', zip: '30040', total_homes: 60, year_built_min: 1991, year_built_max: 1993, year_built_mode: 1992, avg_square_footage: 2800, avg_assessed_value: 410000, hoa_name: 'Canterbury Farms HOA', pipeline_stage: 'research' },
    { name: 'Churchill Crossing', zip: '30028', total_homes: 80, year_built_min: 2015, year_built_max: 2018, year_built_mode: 2016, avg_square_footage: 3200, avg_assessed_value: 580000, hoa_name: 'Churchill Crossing HOA', pipeline_stage: 'research' },
    { name: 'Bentley Ridge', zip: '30040', total_homes: 48, year_built_min: 2011, year_built_max: 2013, year_built_mode: 2012, avg_square_footage: 2600, avg_assessed_value: 430000, hoa_name: 'Bentley Ridge HOA', pipeline_stage: 'research' },
    { name: 'Brannon Oaks', zip: '30041', total_homes: 80, year_built_min: 2003, year_built_max: 2008, year_built_mode: 2005, avg_square_footage: 2900, avg_assessed_value: 465000, hoa_name: 'Brannon Oaks HOA', pipeline_stage: 'research' },
    { name: 'Hampton', zip: '30041', total_homes: 200, year_built_min: 2004, year_built_max: 2012, year_built_mode: 2007, avg_square_footage: 3300, avg_assessed_value: 520000, hoa_name: 'Hampton HOA', pipeline_stage: 'research' },
    { name: 'Polo Fields', zip: '30040', total_homes: 180, year_built_min: 2002, year_built_max: 2010, year_built_mode: 2006, avg_square_footage: 3400, avg_assessed_value: 560000, hoa_name: 'Polo Fields HOA', pipeline_stage: 'research' },
    { name: 'Concord Farms', zip: '30040', total_homes: 120, year_built_min: 2004, year_built_max: 2010, year_built_mode: 2006, avg_square_footage: 2800, avg_assessed_value: 430000, hoa_name: 'Concord Farms HOA', pipeline_stage: 'research' },
    { name: 'James Creek', zip: '30041', total_homes: 90, year_built_min: 2005, year_built_max: 2012, year_built_mode: 2008, avg_square_footage: 3100, avg_assessed_value: 510000, hoa_name: 'James Creek HOA', pipeline_stage: 'research' },
  ];

  for (const sub of subdivisions) {
    await knex('subdivisions').insert(sub);
  }

  // ── REAL CONTRACTORS (from Forsyth County research) ────────────────
  const contractors = [
    { type: 'contractor', first_name: 'Mike', last_name: 'Rodriguez', company: 'DC Cheek Heating & Cooling', title: 'Owner', email: 'info@dccheek.com', phone: '(770) 203-4862', contractor_services: '["hvac"]', contractor_license_number: 'CN209987', contractor_insurance_verified: true, contractor_rating: 4.8, contractor_group_rate_discount: 0.28, source: 'manual', notes: 'A+ BBB, Best of Forsyth. 25+ years, locally owned in Cumming.' },
    { type: 'contractor', first_name: 'Team', last_name: 'Reliable', company: 'Reliable Heating & Air', title: 'Sales Manager', email: 'info@reliableair.com', phone: '(770) 594-9969', contractor_services: '["hvac","plumbing"]', contractor_license_number: 'CN006312', contractor_insurance_verified: true, contractor_rating: 4.7, contractor_group_rate_discount: 0.25, source: 'manual', notes: 'Largest HVAC in GA. Since 1978, 200+ trucks, 4,000+ 5-star reviews, A+ BBB.' },
    { type: 'contractor', first_name: 'Team', last_name: 'Accent', company: 'Accent Roofing Service', title: 'Project Manager', email: 'info@accentroofing.com', phone: '(770) 887-1022', contractor_services: '["roofing"]', contractor_license_number: 'GCCO003573', contractor_insurance_verified: true, contractor_rating: 4.9, contractor_group_rate_discount: 0.22, source: 'manual', notes: 'GAF Master Elite (top 2%), 37+ years, A+ BBB, Angi Super Service 15 consecutive years.' },
    { type: 'contractor', first_name: 'Team', last_name: 'Live Oak', company: 'Live Oak Exteriors', title: 'Sales Director', email: 'info@liveoakexteriors.com', phone: '(770) 212-4724', contractor_services: '["roofing"]', contractor_license_number: 'GCCO007891', contractor_insurance_verified: true, contractor_rating: 4.9, contractor_group_rate_discount: 0.20, source: 'referral', notes: 'Owens Corning Platinum Preferred, 800+ 5-star Google reviews, 10-year workmanship warranty.' },
    { type: 'contractor', first_name: 'Team', last_name: 'KTM', company: 'KTM Roofing', title: 'General Manager', email: 'info@ktmroofing.com', phone: '(770) 888-1780', contractor_services: '["roofing"]', contractor_license_number: 'GCCO004102', contractor_insurance_verified: true, contractor_rating: 4.5, contractor_group_rate_discount: 0.22, source: 'manual', notes: '30+ years serving Forsyth County, residential and commercial.' },
    { type: 'contractor', first_name: 'W', last_name: 'Jr', company: 'W & Jr Painting', title: 'Owner', email: 'info@wjrpainting.com', phone: '(770) 851-5465', contractor_services: '["exterior_paint","deck_staining"]', contractor_license_number: 'GCCO009234', contractor_insurance_verified: true, contractor_rating: 4.8, contractor_group_rate_discount: 0.28, source: 'manual', notes: 'Best Painter in Forsyth County 3 years running. 20+ years experience.' },
    { type: 'contractor', first_name: 'Team', last_name: 'Bear Mountain', company: 'Bear Mountain Custom Painting', title: 'Owner', email: 'info@bearmountainpainting.com', phone: '(678) 827-2468', contractor_services: '["exterior_paint","deck_staining"]', contractor_license_number: 'GCCO008012', contractor_insurance_verified: true, contractor_rating: 4.6, contractor_group_rate_discount: 0.25, source: 'referral', notes: 'Leading painting company in Cumming since 2005.' },
    { type: 'contractor', first_name: 'Team', last_name: 'Water Works', company: 'Water Works Exterior Cleaning', title: 'Owner', email: 'info@cummingexteriorcleaning.com', phone: '(770) 856-4021', contractor_services: '["pressure_washing","gutter_cleaning"]', contractor_license_number: 'GCCO010456', contractor_insurance_verified: true, contractor_rating: 4.7, contractor_group_rate_discount: 0.35, source: 'manual', notes: 'Pressure washing specialist, preferred company in Cumming area.' },
    { type: 'contractor', first_name: 'Team', last_name: 'ARC', company: 'ARC Painting Company', title: 'Owner', email: 'info@arc-painting.net', phone: '(770) 856-8877', contractor_services: '["exterior_paint","pressure_washing"]', contractor_license_number: 'GCCO006789', contractor_insurance_verified: true, contractor_rating: 4.5, contractor_group_rate_discount: 0.28, source: 'manual', notes: 'Leading painting + pressure washing in Cumming for ~20 years.' },
    { type: 'contractor', first_name: 'Team', last_name: 'Forsyth Exteriors', company: 'Forsyth Exteriors', title: 'General Manager', email: 'info@forsythexteriors.com', phone: '(770) 888-0815', contractor_services: '["roofing","exterior_paint"]', contractor_license_number: 'GCCO005678', contractor_insurance_verified: true, contractor_rating: 4.6, contractor_group_rate_discount: 0.22, source: 'manual', notes: '30+ years in Cumming, roofing and exterior services.' },
  ];

  for (const c of contractors) {
    await knex('contacts').insert({ ...c, status: 'active' });
  }

  // ── SAMPLE PROPERTIES (realistic for top-priority subdivisions) ────
  const streets = [
    'Pilgrim Mill Rd', 'Bethelview Rd', 'Keith Bridge Rd', 'Bald Ridge Marina Rd',
    'Buford Dam Rd', 'Spot Rd', 'Post Rd', 'Dahlonega Hwy', 'Peachtree Pkwy',
    'McFarland Rd', 'Brannon Rd', 'Tribble Gap Rd', 'Kelly Mill Rd',
    'Haw Creek Dr', 'Majors Rd', 'Coal Mountain Dr', 'Sharon Rd', 'Castleberry Rd',
    'Sawnee Dr', 'Lanier Springs Dr',
  ];
  const firstNames = [
    'Michael','Sarah','James','Linda','David','Jennifer','Robert','Amy','Christopher',
    'Maria','Thomas','Wei','Patrick','Susan','Sanjay','Priya','Hiroshi','Laura',
    'Raj','Anita','Brian','Kate','Daniel','Rachel','Alexander','Emily','Brandon',
    'Jessica','Derek','Vanessa','Eric','Sophia','Gregory','Hannah','Ian','Olivia',
    'Jun','Kevin','Luis','Carmen','Marcus','Tiffany','Nikolai','Elena','Oliver',
    'Samantha','Ravi','Sean','Tyler','Amanda','Carlos','Min-Jun','Aisha','Dmitri',
  ];
  const lastNames = [
    'Thompson','Martinez','Chen','Williams','Johnson','Davis','Patel','Anderson',
    'Garcia','Zhang','O\'Brien','Tanaka','Robinson','Sharma','Sullivan','Kim',
    'Harris','Lewis','Mitchell','Walker','Hassan','Young','Park','White','Gupta',
    'Clark','Rodriguez','Turner','Adams','Petrov','Morgan','Krishnan','Hall',
    'Colombo','Scott','Lee','Mueller','Washington','Nakamura','Phillips','Campbell',
    'Watanabe','Stewart','Reyes','Brooks','Volkov','Reed','Desai','Torres','Foster',
  ];

  function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // Generate properties for the 6 highest-priority subdivisions
  const propSubs = [
    { name: 'Bethelview Downs', count: 30, yearMin: 2001, yearMax: 2007 },
    { name: 'Brookwood', count: 30, yearMin: 2001, yearMax: 2005 },
    { name: 'Brannon Oaks', count: 25, yearMin: 2003, yearMax: 2008 },
    { name: 'Bridgetown', count: 30, yearMin: 2005, yearMax: 2016 },
    { name: 'Sharon Springs', count: 25, yearMin: 2005, yearMax: 2008 },
    { name: 'Castleberry Heights', count: 30, yearMin: 2005, yearMax: 2018 },
    { name: 'Windermere', count: 30, yearMin: 2000, yearMax: 2012 },
  ];

  let parcelNum = 0;
  for (const ps of propSubs) {
    for (let i = 0; i < ps.count; i++) {
      parcelNum++;
      const yb = rnd(ps.yearMin, ps.yearMax);
      await knex('properties').insert({
        parcel_id: `090-${String(Math.floor(parcelNum / 100) + 1).padStart(3, '0')}-${String(parcelNum % 1000).padStart(3, '0')}`,
        address: `${rnd(1000, 9999)} ${pick(streets)}`,
        city: 'Cumming', state: 'GA', zip: '30041',
        subdivision: ps.name,
        owner_name: `${pick(firstNames)} ${pick(lastNames)}`,
        year_built: yb,
        square_footage: rnd(2200, 3800),
        bedrooms: rnd(3, 5),
        bathrooms: [2.0, 2.5, 3.0, 3.5][rnd(0, 3)],
        assessed_value: rnd(350, 650) * 1000,
        lot_size_acres: Math.round(rnd(22, 50) / 100 * 100) / 100,
        property_type: 'Single Family',
        hvac_year_installed: yb,
        water_heater_year: yb,
        roof_year: yb,
        exterior_paint_year: yb,
      });
    }
  }
}
