/**
 * NW Homeworks — Remodel Budget Estimator
 * Cost Data Model, Regional Multipliers, and Zip-to-Metro Mapping
 */

// ─── Cost Matrix ────────────────────────────────────────────────
// Structure: COST_DATA[roomType][category][finishLevel] → { low, high } per sq ft
// For fixed-cost trades (plumbing, electrical, demo, drywall), values include
// a base component so small rooms don't get unrealistically low estimates.
// The calculate() function in estimator.js applies: base + (perSqft × sqft)

const COST_DATA = {
  kitchen: {
    cabinets: {
      label: 'Cabinets',
      icon: 'cabinets',
      budget:   { base: 800,  perSqft: 45,  low: 0.75, high: 1.3 },
      midRange: { base: 1500, perSqft: 90,  low: 0.8,  high: 1.25 },
      highEnd:  { base: 3000, perSqft: 180, low: 0.8,  high: 1.3 },
      ikea:     { base: 1000, perSqft: 35,  low: 0.8,  high: 1.3 }
    },
    countertops: {
      label: 'Countertops',
      icon: 'countertops',
      budget:   { base: 400,  perSqft: 18, low: 0.8, high: 1.3 },
      midRange: { base: 800,  perSqft: 35, low: 0.8, high: 1.3 },
      highEnd:  { base: 1500, perSqft: 70, low: 0.75, high: 1.35 },
      ikea:     { base: 600,  perSqft: 22, low: 0.8, high: 1.3 }
    },
    flooring: {
      label: 'Flooring',
      icon: 'flooring',
      budget:   { base: 300,  perSqft: 8,  low: 0.8, high: 1.25 },
      midRange: { base: 500,  perSqft: 15, low: 0.8, high: 1.25 },
      highEnd:  { base: 800,  perSqft: 30, low: 0.8, high: 1.3 },
      ikea:     { base: 300,  perSqft: 10, low: 0.8, high: 1.25 }
    },
    plumbing: {
      label: 'Plumbing',
      icon: 'plumbing',
      budget:   { base: 600,  perSqft: 3,  low: 0.8, high: 1.2 },
      midRange: { base: 1000, perSqft: 5,  low: 0.8, high: 1.25 },
      highEnd:  { base: 1800, perSqft: 10, low: 0.75, high: 1.3 },
      ikea:     { base: 800,  perSqft: 3,  low: 0.8, high: 1.2 }
    },
    electrical: {
      label: 'Electrical',
      icon: 'electrical',
      budget:   { base: 500,  perSqft: 5,  low: 0.8, high: 1.25 },
      midRange: { base: 1200, perSqft: 8,  low: 0.8, high: 1.3 },
      highEnd:  { base: 2000, perSqft: 15, low: 0.75, high: 1.35 },
      ikea:     { base: 800,  perSqft: 6,  low: 0.8, high: 1.25 }
    },
    backsplash: {
      label: 'Backsplash',
      icon: 'backsplash',
      budget:   { base: 300,  perSqft: 5,  low: 0.8, high: 1.2 },
      midRange: { base: 600,  perSqft: 10, low: 0.8, high: 1.3 },
      highEnd:  { base: 1200, perSqft: 20, low: 0.75, high: 1.35 },
      ikea:     { base: 400,  perSqft: 6,  low: 0.8, high: 1.25 }
    },
    demolition: {
      label: 'Demolition',
      icon: 'demolition',
      budget:   { base: 500,  perSqft: 2, low: 0.85, high: 1.2 },
      midRange: { base: 800,  perSqft: 3, low: 0.85, high: 1.2 },
      highEnd:  { base: 1200, perSqft: 5, low: 0.8,  high: 1.25 },
      ikea:     { base: 500,  perSqft: 2, low: 0.85, high: 1.2 }
    },
    drywall: {
      label: 'Drywall & Framing',
      icon: 'drywall',
      budget:   { base: 300,  perSqft: 3,  low: 0.8, high: 1.2 },
      midRange: { base: 600,  perSqft: 5,  low: 0.8, high: 1.25 },
      highEnd:  { base: 1000, perSqft: 10, low: 0.8, high: 1.3 },
      ikea:     { base: 400,  perSqft: 3,  low: 0.8, high: 1.2 }
    }
  },

  bathroom: {
    vanity: {
      label: 'Vanity & Cabinets',
      icon: 'cabinets',
      budget:   { base: 400,  perSqft: 15, low: 0.75, high: 1.3 },
      midRange: { base: 1000, perSqft: 30, low: 0.8,  high: 1.25 },
      highEnd:  { base: 2500, perSqft: 60, low: 0.8,  high: 1.3 },
      ikea:     { base: 500,  perSqft: 18, low: 0.8,  high: 1.3 }
    },
    countertops: {
      label: 'Countertops',
      icon: 'countertops',
      budget:   { base: 200,  perSqft: 8,  low: 0.8, high: 1.3 },
      midRange: { base: 500,  perSqft: 18, low: 0.8, high: 1.3 },
      highEnd:  { base: 1000, perSqft: 40, low: 0.75, high: 1.35 },
      ikea:     { base: 300,  perSqft: 10, low: 0.8, high: 1.3 }
    },
    flooring: {
      label: 'Flooring',
      icon: 'flooring',
      budget:   { base: 200,  perSqft: 8,  low: 0.8, high: 1.25 },
      midRange: { base: 400,  perSqft: 15, low: 0.8, high: 1.25 },
      highEnd:  { base: 700,  perSqft: 30, low: 0.8, high: 1.3 },
      ikea:     { base: 250,  perSqft: 10, low: 0.8, high: 1.25 }
    },
    plumbing: {
      label: 'Plumbing',
      icon: 'plumbing',
      budget:   { base: 800,  perSqft: 5,  low: 0.8, high: 1.2 },
      midRange: { base: 1500, perSqft: 10, low: 0.8, high: 1.25 },
      highEnd:  { base: 3000, perSqft: 20, low: 0.75, high: 1.3 },
      ikea:     { base: 800,  perSqft: 5,  low: 0.8, high: 1.2 }
    },
    electrical: {
      label: 'Electrical',
      icon: 'electrical',
      budget:   { base: 400,  perSqft: 4, low: 0.8, high: 1.25 },
      midRange: { base: 800,  perSqft: 8, low: 0.8, high: 1.3 },
      highEnd:  { base: 1500, perSqft: 15, low: 0.75, high: 1.35 },
      ikea:     { base: 500,  perSqft: 5,  low: 0.8, high: 1.25 }
    },
    tilework: {
      label: 'Tile & Surround',
      icon: 'backsplash',
      budget:   { base: 400,  perSqft: 10, low: 0.8, high: 1.25 },
      midRange: { base: 800,  perSqft: 20, low: 0.8, high: 1.3 },
      highEnd:  { base: 1500, perSqft: 40, low: 0.75, high: 1.35 },
      ikea:     { base: 500,  perSqft: 12, low: 0.8, high: 1.25 }
    },
    shower_tub: {
      label: 'Shower / Tub',
      icon: 'shower',
      budget:   { base: 800,  perSqft: 8,  low: 0.8, high: 1.25 },
      midRange: { base: 2000, perSqft: 15, low: 0.8, high: 1.3 },
      highEnd:  { base: 4000, perSqft: 35, low: 0.75, high: 1.35 },
      ikea:     { base: 1000, perSqft: 10, low: 0.8, high: 1.25 }
    },
    demolition: {
      label: 'Demolition',
      icon: 'demolition',
      budget:   { base: 400,  perSqft: 3, low: 0.85, high: 1.2 },
      midRange: { base: 600,  perSqft: 5, low: 0.85, high: 1.2 },
      highEnd:  { base: 1000, perSqft: 8, low: 0.8,  high: 1.25 },
      ikea:     { base: 400,  perSqft: 3, low: 0.85, high: 1.2 }
    },
    drywall: {
      label: 'Drywall & Framing',
      icon: 'drywall',
      budget:   { base: 250,  perSqft: 3,  low: 0.8, high: 1.2 },
      midRange: { base: 500,  perSqft: 5,  low: 0.8, high: 1.25 },
      highEnd:  { base: 800,  perSqft: 10, low: 0.8, high: 1.3 },
      ikea:     { base: 300,  perSqft: 3,  low: 0.8, high: 1.2 }
    }
  }
};

// ─── Room Size Presets ──────────────────────────────────────────

const ROOM_PRESETS = {
  kitchen: [
    { label: "Small Galley (6' × 10')",   sqft: 60,  id: 'k-sm-galley' },
    { label: "Small (8' × 10')",           sqft: 80,  id: 'k-sm' },
    { label: "Medium (10' × 12')",         sqft: 120, id: 'k-md' },
    { label: "Large (12' × 16')",          sqft: 192, id: 'k-lg' },
    { label: "Extra Large (14' × 20')",    sqft: 280, id: 'k-xl' }
  ],
  bathroom: [
    { label: "Half Bath (3' × 6')",        sqft: 18,  id: 'b-half' },
    { label: "Small (5' × 8')",            sqft: 40,  id: 'b-sm' },
    { label: "Medium (8' × 10')",          sqft: 80,  id: 'b-md' },
    { label: "Large Primary (10' × 14')",  sqft: 140, id: 'b-lg' },
    { label: "Luxury Primary (12' × 16')", sqft: 192, id: 'b-xl' }
  ]
};

// ─── Finish Level Metadata ──────────────────────────────────────

const FINISH_LEVELS = {
  budget: {
    label: 'Budget',
    icon: '$',
    description: 'Stock materials, basic fixtures, cosmetic updates'
  },
  midRange: {
    label: 'Mid-Range',
    icon: '$$',
    description: 'Semi-custom cabinets, quartz counters, quality fixtures'
  },
  highEnd: {
    label: 'High-End',
    icon: '$$$',
    description: 'Custom cabinets, natural stone, premium appliances'
  },
  ikea: {
    label: 'IKEA Kitchen',
    icon: 'IKEA',
    description: 'SEKTION cabinets with professional full-service installation'
  }
};

// ─── Regional Cost Multipliers ──────────────────────────────────
// 1.0 = national average. Derived from BLS OEWS construction wage data
// and cross-referenced with Zonda/JLC Cost vs. Value regional factors.

const REGIONAL_MULTIPLIERS = {
  "Seattle-Tacoma-Bellevue, WA": 1.22,
  "San Francisco-Oakland-Berkeley, CA": 1.45,
  "San Jose-Sunnyvale-Santa Clara, CA": 1.42,
  "New York-Newark-Jersey City, NY-NJ": 1.38,
  "Boston-Cambridge-Newton, MA-NH": 1.30,
  "Washington-Arlington-Alexandria, DC-VA-MD": 1.25,
  "Los Angeles-Long Beach-Anaheim, CA": 1.25,
  "San Diego-Chula Vista-Carlsbad, CA": 1.20,
  "Honolulu, HI": 1.35,
  "Anchorage, AK": 1.30,
  "Portland-Vancouver-Hillsboro, OR-WA": 1.12,
  "Denver-Aurora-Lakewood, CO": 1.08,
  "Minneapolis-St. Paul-Bloomington, MN-WI": 1.06,
  "Chicago-Naperville-Elgin, IL-IN-WI": 1.08,
  "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD": 1.12,
  "Baltimore-Columbia-Towson, MD": 1.10,
  "Hartford-East Hartford-Middletown, CT": 1.15,
  "Providence-Warwick, RI-MA": 1.10,
  "Sacramento-Roseville-Folsom, CA": 1.15,
  "Riverside-San Bernardino-Ontario, CA": 1.10,
  "Miami-Fort Lauderdale-Pompano Beach, FL": 1.05,
  "Tampa-St. Petersburg-Clearwater, FL": 0.95,
  "Orlando-Kissimmee-Sanford, FL": 0.93,
  "Jacksonville, FL": 0.92,
  "Detroit-Warren-Dearborn, MI": 1.02,
  "Pittsburgh, PA": 1.00,
  "Cleveland-Elyria, OH": 0.95,
  "Columbus, OH": 0.95,
  "Cincinnati, OH-KY-IN": 0.93,
  "St. Louis, MO-IL": 0.95,
  "Kansas City, MO-KS": 0.92,
  "Milwaukee-Waukesha, WI": 1.02,
  "Indianapolis-Carmel-Anderson, IN": 0.90,
  "Nashville-Davidson-Murfreesboro, TN": 0.92,
  "Louisville/Jefferson County, KY-IN": 0.88,
  "Charlotte-Concord-Gastonia, NC-SC": 0.90,
  "Raleigh-Cary, NC": 0.92,
  "Richmond, VA": 0.90,
  "Virginia Beach-Norfolk-Newport News, VA-NC": 0.88,
  "Atlanta-Sandy Springs-Alpharetta, GA": 0.92,
  "Birmingham-Hoover, AL": 0.85,
  "New Orleans-Metairie, LA": 0.90,
  "Memphis, TN-MS-AR": 0.85,
  "Dallas-Fort Worth-Arlington, TX": 0.90,
  "Houston-The Woodlands-Sugar Land, TX": 0.92,
  "San Antonio-New Braunfels, TX": 0.88,
  "Austin-Round Rock-Georgetown, TX": 0.95,
  "Phoenix-Mesa-Chandler, AZ": 0.90,
  "Tucson, AZ": 0.85,
  "Las Vegas-Henderson-Paradise, NV": 0.95,
  "Salt Lake City, UT": 0.95,
  "Boise City, ID": 0.92,
  "Albuquerque, NM": 0.88,
  "Oklahoma City, OK": 0.85,
  "Omaha-Council Bluffs, NE-IA": 0.88,
  "Des Moines-West Des Moines, IA": 0.90,
  "Little Rock-North Little Rock-Conway, AR": 0.82,
  "Charleston-North Charleston, SC": 0.90,
  "Spokane-Spokane Valley, WA": 1.05,
  "Tacoma-Lakewood, WA": 1.18,
  "Olympia-Lacey-Tumwater, WA": 1.12,
  "Bellingham, WA": 1.10,
  "Bremerton-Silverdale-Port Orchard, WA": 1.12,
  "_default": 1.0
};

// ─── Zip Code Prefix → Metro Area Mapping ───────────────────────
// First 3 digits of US zip code → metro name key in REGIONAL_MULTIPLIERS
// Covers major metros representing ~75% of US population

const ZIP_PREFIX_TO_METRO = {
  // Washington State
  "980": "Seattle-Tacoma-Bellevue, WA",
  "981": "Seattle-Tacoma-Bellevue, WA",
  "982": "Seattle-Tacoma-Bellevue, WA",
  "983": "Seattle-Tacoma-Bellevue, WA",
  "984": "Tacoma-Lakewood, WA",
  "985": "Olympia-Lacey-Tumwater, WA",
  "990": "Spokane-Spokane Valley, WA",
  "991": "Spokane-Spokane Valley, WA",
  "992": "Spokane-Spokane Valley, WA",
  "982": "Seattle-Tacoma-Bellevue, WA",
  "986": "Portland-Vancouver-Hillsboro, OR-WA",
  "988": "Bellingham, WA",
  "983": "Seattle-Tacoma-Bellevue, WA",
  "987": "Bremerton-Silverdale-Port Orchard, WA",

  // Oregon
  "970": "Portland-Vancouver-Hillsboro, OR-WA",
  "971": "Portland-Vancouver-Hillsboro, OR-WA",
  "972": "Portland-Vancouver-Hillsboro, OR-WA",
  "973": "Portland-Vancouver-Hillsboro, OR-WA",
  "974": "Portland-Vancouver-Hillsboro, OR-WA",

  // California
  "900": "Los Angeles-Long Beach-Anaheim, CA",
  "901": "Los Angeles-Long Beach-Anaheim, CA",
  "902": "Los Angeles-Long Beach-Anaheim, CA",
  "903": "Los Angeles-Long Beach-Anaheim, CA",
  "904": "Los Angeles-Long Beach-Anaheim, CA",
  "905": "Los Angeles-Long Beach-Anaheim, CA",
  "906": "Los Angeles-Long Beach-Anaheim, CA",
  "907": "Los Angeles-Long Beach-Anaheim, CA",
  "908": "Los Angeles-Long Beach-Anaheim, CA",
  "910": "Los Angeles-Long Beach-Anaheim, CA",
  "911": "Los Angeles-Long Beach-Anaheim, CA",
  "912": "Los Angeles-Long Beach-Anaheim, CA",
  "913": "Los Angeles-Long Beach-Anaheim, CA",
  "914": "Los Angeles-Long Beach-Anaheim, CA",
  "915": "Riverside-San Bernardino-Ontario, CA",
  "916": "Riverside-San Bernardino-Ontario, CA",
  "917": "Riverside-San Bernardino-Ontario, CA",
  "918": "Riverside-San Bernardino-Ontario, CA",
  "919": "San Diego-Chula Vista-Carlsbad, CA",
  "920": "San Diego-Chula Vista-Carlsbad, CA",
  "921": "San Diego-Chula Vista-Carlsbad, CA",
  "940": "San Francisco-Oakland-Berkeley, CA",
  "941": "San Francisco-Oakland-Berkeley, CA",
  "942": "Sacramento-Roseville-Folsom, CA",
  "943": "Sacramento-Roseville-Folsom, CA",
  "944": "San Francisco-Oakland-Berkeley, CA",
  "945": "San Francisco-Oakland-Berkeley, CA",
  "946": "San Francisco-Oakland-Berkeley, CA",
  "947": "San Francisco-Oakland-Berkeley, CA",
  "948": "San Francisco-Oakland-Berkeley, CA",
  "949": "San Jose-Sunnyvale-Santa Clara, CA",
  "950": "San Jose-Sunnyvale-Santa Clara, CA",
  "951": "Riverside-San Bernardino-Ontario, CA",
  "952": "Riverside-San Bernardino-Ontario, CA",
  "953": "Sacramento-Roseville-Folsom, CA",
  "954": "Sacramento-Roseville-Folsom, CA",
  "955": "Sacramento-Roseville-Folsom, CA",
  "956": "Sacramento-Roseville-Folsom, CA",
  "957": "Sacramento-Roseville-Folsom, CA",
  "958": "Sacramento-Roseville-Folsom, CA",

  // New York
  "100": "New York-Newark-Jersey City, NY-NJ",
  "101": "New York-Newark-Jersey City, NY-NJ",
  "102": "New York-Newark-Jersey City, NY-NJ",
  "103": "New York-Newark-Jersey City, NY-NJ",
  "104": "New York-Newark-Jersey City, NY-NJ",
  "105": "New York-Newark-Jersey City, NY-NJ",
  "106": "New York-Newark-Jersey City, NY-NJ",
  "107": "New York-Newark-Jersey City, NY-NJ",
  "108": "New York-Newark-Jersey City, NY-NJ",
  "109": "New York-Newark-Jersey City, NY-NJ",
  "110": "New York-Newark-Jersey City, NY-NJ",
  "111": "New York-Newark-Jersey City, NY-NJ",
  "112": "New York-Newark-Jersey City, NY-NJ",
  "113": "New York-Newark-Jersey City, NY-NJ",
  "114": "New York-Newark-Jersey City, NY-NJ",
  "115": "New York-Newark-Jersey City, NY-NJ",
  "116": "New York-Newark-Jersey City, NY-NJ",

  // New Jersey
  "070": "New York-Newark-Jersey City, NY-NJ",
  "071": "New York-Newark-Jersey City, NY-NJ",
  "072": "New York-Newark-Jersey City, NY-NJ",
  "073": "New York-Newark-Jersey City, NY-NJ",
  "074": "New York-Newark-Jersey City, NY-NJ",
  "075": "New York-Newark-Jersey City, NY-NJ",
  "076": "New York-Newark-Jersey City, NY-NJ",
  "077": "New York-Newark-Jersey City, NY-NJ",
  "078": "New York-Newark-Jersey City, NY-NJ",
  "079": "New York-Newark-Jersey City, NY-NJ",

  // Massachusetts / New England
  "021": "Boston-Cambridge-Newton, MA-NH",
  "022": "Boston-Cambridge-Newton, MA-NH",
  "023": "Boston-Cambridge-Newton, MA-NH",
  "024": "Boston-Cambridge-Newton, MA-NH",
  "010": "Hartford-East Hartford-Middletown, CT",
  "011": "Hartford-East Hartford-Middletown, CT",
  "028": "Providence-Warwick, RI-MA",
  "029": "Providence-Warwick, RI-MA",
  "060": "Hartford-East Hartford-Middletown, CT",
  "061": "Hartford-East Hartford-Middletown, CT",

  // DC / Maryland / Virginia
  "200": "Washington-Arlington-Alexandria, DC-VA-MD",
  "201": "Washington-Arlington-Alexandria, DC-VA-MD",
  "202": "Washington-Arlington-Alexandria, DC-VA-MD",
  "203": "Washington-Arlington-Alexandria, DC-VA-MD",
  "204": "Washington-Arlington-Alexandria, DC-VA-MD",
  "205": "Washington-Arlington-Alexandria, DC-VA-MD",
  "206": "Washington-Arlington-Alexandria, DC-VA-MD",
  "207": "Baltimore-Columbia-Towson, MD",
  "208": "Baltimore-Columbia-Towson, MD",
  "209": "Baltimore-Columbia-Towson, MD",
  "210": "Baltimore-Columbia-Towson, MD",
  "211": "Baltimore-Columbia-Towson, MD",
  "212": "Baltimore-Columbia-Towson, MD",
  "220": "Washington-Arlington-Alexandria, DC-VA-MD",
  "221": "Washington-Arlington-Alexandria, DC-VA-MD",
  "222": "Washington-Arlington-Alexandria, DC-VA-MD",
  "223": "Richmond, VA",
  "230": "Richmond, VA",
  "231": "Virginia Beach-Norfolk-Newport News, VA-NC",
  "232": "Virginia Beach-Norfolk-Newport News, VA-NC",
  "233": "Virginia Beach-Norfolk-Newport News, VA-NC",
  "234": "Virginia Beach-Norfolk-Newport News, VA-NC",

  // Pennsylvania
  "150": "Pittsburgh, PA",
  "151": "Pittsburgh, PA",
  "152": "Pittsburgh, PA",
  "190": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",
  "191": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",
  "192": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",
  "193": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",
  "194": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",

  // Illinois
  "600": "Chicago-Naperville-Elgin, IL-IN-WI",
  "601": "Chicago-Naperville-Elgin, IL-IN-WI",
  "602": "Chicago-Naperville-Elgin, IL-IN-WI",
  "603": "Chicago-Naperville-Elgin, IL-IN-WI",
  "604": "Chicago-Naperville-Elgin, IL-IN-WI",
  "605": "Chicago-Naperville-Elgin, IL-IN-WI",
  "606": "Chicago-Naperville-Elgin, IL-IN-WI",

  // Michigan
  "480": "Detroit-Warren-Dearborn, MI",
  "481": "Detroit-Warren-Dearborn, MI",
  "482": "Detroit-Warren-Dearborn, MI",
  "483": "Detroit-Warren-Dearborn, MI",
  "484": "Detroit-Warren-Dearborn, MI",

  // Ohio
  "441": "Cleveland-Elyria, OH",
  "440": "Cleveland-Elyria, OH",
  "430": "Columbus, OH",
  "431": "Columbus, OH",
  "432": "Columbus, OH",
  "450": "Cincinnati, OH-KY-IN",
  "451": "Cincinnati, OH-KY-IN",
  "452": "Cincinnati, OH-KY-IN",

  // Minnesota
  "550": "Minneapolis-St. Paul-Bloomington, MN-WI",
  "551": "Minneapolis-St. Paul-Bloomington, MN-WI",
  "553": "Minneapolis-St. Paul-Bloomington, MN-WI",
  "554": "Minneapolis-St. Paul-Bloomington, MN-WI",
  "555": "Minneapolis-St. Paul-Bloomington, MN-WI",

  // Wisconsin
  "530": "Milwaukee-Waukesha, WI",
  "531": "Milwaukee-Waukesha, WI",
  "532": "Milwaukee-Waukesha, WI",

  // Missouri
  "630": "St. Louis, MO-IL",
  "631": "St. Louis, MO-IL",
  "640": "Kansas City, MO-KS",
  "641": "Kansas City, MO-KS",
  "660": "Kansas City, MO-KS",
  "661": "Kansas City, MO-KS",
  "662": "Kansas City, MO-KS",

  // Indiana
  "460": "Indianapolis-Carmel-Anderson, IN",
  "461": "Indianapolis-Carmel-Anderson, IN",
  "462": "Indianapolis-Carmel-Anderson, IN",

  // Kentucky
  "400": "Louisville/Jefferson County, KY-IN",
  "401": "Louisville/Jefferson County, KY-IN",
  "402": "Louisville/Jefferson County, KY-IN",

  // Tennessee
  "370": "Nashville-Davidson-Murfreesboro, TN",
  "371": "Nashville-Davidson-Murfreesboro, TN",
  "372": "Nashville-Davidson-Murfreesboro, TN",
  "380": "Memphis, TN-MS-AR",
  "381": "Memphis, TN-MS-AR",

  // Georgia
  "300": "Atlanta-Sandy Springs-Alpharetta, GA",
  "301": "Atlanta-Sandy Springs-Alpharetta, GA",
  "302": "Atlanta-Sandy Springs-Alpharetta, GA",
  "303": "Atlanta-Sandy Springs-Alpharetta, GA",

  // North Carolina
  "270": "Raleigh-Cary, NC",
  "271": "Raleigh-Cary, NC",
  "275": "Raleigh-Cary, NC",
  "276": "Charlotte-Concord-Gastonia, NC-SC",
  "280": "Charlotte-Concord-Gastonia, NC-SC",
  "281": "Charlotte-Concord-Gastonia, NC-SC",
  "282": "Charlotte-Concord-Gastonia, NC-SC",

  // South Carolina
  "290": "Charlotte-Concord-Gastonia, NC-SC",
  "294": "Charleston-North Charleston, SC",
  "295": "Charleston-North Charleston, SC",

  // Alabama
  "350": "Birmingham-Hoover, AL",
  "351": "Birmingham-Hoover, AL",
  "352": "Birmingham-Hoover, AL",

  // Louisiana
  "700": "New Orleans-Metairie, LA",
  "701": "New Orleans-Metairie, LA",

  // Florida
  "330": "Miami-Fort Lauderdale-Pompano Beach, FL",
  "331": "Miami-Fort Lauderdale-Pompano Beach, FL",
  "332": "Miami-Fort Lauderdale-Pompano Beach, FL",
  "333": "Miami-Fort Lauderdale-Pompano Beach, FL",
  "334": "Miami-Fort Lauderdale-Pompano Beach, FL",
  "335": "Tampa-St. Petersburg-Clearwater, FL",
  "336": "Tampa-St. Petersburg-Clearwater, FL",
  "337": "Tampa-St. Petersburg-Clearwater, FL",
  "328": "Orlando-Kissimmee-Sanford, FL",
  "327": "Orlando-Kissimmee-Sanford, FL",
  "347": "Orlando-Kissimmee-Sanford, FL",
  "322": "Jacksonville, FL",
  "321": "Jacksonville, FL",

  // Texas
  "750": "Dallas-Fort Worth-Arlington, TX",
  "751": "Dallas-Fort Worth-Arlington, TX",
  "752": "Dallas-Fort Worth-Arlington, TX",
  "753": "Dallas-Fort Worth-Arlington, TX",
  "760": "Dallas-Fort Worth-Arlington, TX",
  "761": "Dallas-Fort Worth-Arlington, TX",
  "770": "Houston-The Woodlands-Sugar Land, TX",
  "771": "Houston-The Woodlands-Sugar Land, TX",
  "772": "Houston-The Woodlands-Sugar Land, TX",
  "773": "Houston-The Woodlands-Sugar Land, TX",
  "774": "Houston-The Woodlands-Sugar Land, TX",
  "775": "Houston-The Woodlands-Sugar Land, TX",
  "780": "San Antonio-New Braunfels, TX",
  "781": "San Antonio-New Braunfels, TX",
  "782": "San Antonio-New Braunfels, TX",
  "786": "Austin-Round Rock-Georgetown, TX",
  "787": "Austin-Round Rock-Georgetown, TX",
  "788": "Austin-Round Rock-Georgetown, TX",

  // Arizona
  "850": "Phoenix-Mesa-Chandler, AZ",
  "851": "Phoenix-Mesa-Chandler, AZ",
  "852": "Phoenix-Mesa-Chandler, AZ",
  "853": "Phoenix-Mesa-Chandler, AZ",
  "857": "Tucson, AZ",

  // Nevada
  "889": "Las Vegas-Henderson-Paradise, NV",
  "890": "Las Vegas-Henderson-Paradise, NV",
  "891": "Las Vegas-Henderson-Paradise, NV",

  // Colorado
  "800": "Denver-Aurora-Lakewood, CO",
  "801": "Denver-Aurora-Lakewood, CO",
  "802": "Denver-Aurora-Lakewood, CO",
  "803": "Denver-Aurora-Lakewood, CO",
  "804": "Denver-Aurora-Lakewood, CO",
  "805": "Denver-Aurora-Lakewood, CO",

  // Utah
  "840": "Salt Lake City, UT",
  "841": "Salt Lake City, UT",

  // Idaho
  "836": "Boise City, ID",
  "837": "Boise City, ID",

  // New Mexico
  "870": "Albuquerque, NM",
  "871": "Albuquerque, NM",

  // Oklahoma
  "730": "Oklahoma City, OK",
  "731": "Oklahoma City, OK",

  // Nebraska
  "680": "Omaha-Council Bluffs, NE-IA",
  "681": "Omaha-Council Bluffs, NE-IA",

  // Iowa
  "503": "Des Moines-West Des Moines, IA",
  "500": "Des Moines-West Des Moines, IA",

  // Arkansas
  "720": "Little Rock-North Little Rock-Conway, AR",
  "721": "Little Rock-North Little Rock-Conway, AR",
  "722": "Little Rock-North Little Rock-Conway, AR",

  // Hawaii
  "967": "Honolulu, HI",
  "968": "Honolulu, HI",

  // Alaska
  "995": "Anchorage, AK",
  "996": "Anchorage, AK"
};

// ─── Contextual Tips ────────────────────────────────────────────

const TIPS = {
  ikea: [
    "IKEA cabinets typically save 40–60% compared to custom cabinets of similar quality.",
    "Budget 3–5× the cost of IKEA cabinets alone for the complete kitchen project.",
    "IKEA's SEKTION system uses the same quality European-style hinges and drawer slides found in high-end custom kitchens.",
    "A certified IKEA kitchen installer coordinates all trades — plumbing, electrical, countertops — so you don't have to."
  ],
  budget: [
    "Stock cabinets and laminate countertops offer the best value for a budget remodel.",
    "Keeping the existing layout avoids costly plumbing and electrical relocation.",
    "Refinishing existing cabinets instead of replacing them can save 50% or more on cabinet costs."
  ],
  midRange: [
    "Semi-custom cabinets paired with quartz countertops hit the mid-range sweet spot.",
    "Mid-range remodels offer the best return on investment for home resale — typically recouping 75–80% of costs.",
    "Consider soft-close hinges and undermount drawer slides — they add minimal cost but significant daily comfort."
  ],
  highEnd: [
    "Custom cabinets and natural stone countertops define a high-end remodel.",
    "Expect longer lead times for custom materials — plan 3–6 months ahead for ordering.",
    "Invest in quality appliances and fixtures — they're used daily and make the biggest impact on how the space feels."
  ],
  general: [
    "Always add 10–15% contingency to your remodel budget for unexpected costs.",
    "Getting 3+ contractor bids helps ensure fair pricing for your project.",
    "Permits typically cost $200–$1,500 depending on scope and location."
  ]
};

// ─── Helper Functions ───────────────────────────────────────────

function getMetroFromZip(zip) {
  if (!zip || zip.length < 3) return null;
  const prefix = zip.substring(0, 3);
  return ZIP_PREFIX_TO_METRO[prefix] || null;
}

function getRegionalMultiplier(zip) {
  const metro = getMetroFromZip(zip);
  if (!metro) return REGIONAL_MULTIPLIERS["_default"];
  return REGIONAL_MULTIPLIERS[metro] || REGIONAL_MULTIPLIERS["_default"];
}

function getMetroDisplayName(zip) {
  const metro = getMetroFromZip(zip);
  if (!metro) return null;
  // Shorten for display: "Seattle-Tacoma-Bellevue, WA" → "Seattle-Tacoma area"
  const parts = metro.split(',')[0].split('-');
  if (parts.length >= 2) return parts[0] + '-' + parts[1] + ' area';
  return parts[0] + ' area';
}

function getMultiplierDescription(multiplier) {
  const pct = Math.round((multiplier - 1) * 100);
  if (pct > 0) return `${pct}% above national average`;
  if (pct < 0) return `${Math.abs(pct)}% below national average`;
  return 'at national average';
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

function selectTips(finishLevel, roomType) {
  const levelTips = TIPS[finishLevel] || TIPS.midRange;
  const generalTips = TIPS.general;
  // Pick 2 level-specific + 1 general
  const picked = [];
  picked.push(levelTips[Math.floor(Math.random() * levelTips.length)]);
  let second;
  do { second = levelTips[Math.floor(Math.random() * levelTips.length)]; } while (second === picked[0] && levelTips.length > 1);
  picked.push(second);
  picked.push(generalTips[Math.floor(Math.random() * generalTips.length)]);
  return picked;
}
