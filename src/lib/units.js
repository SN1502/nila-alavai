// Land-area units, all defined by their size in square feet.
//
// Every conversion goes through square feet:
//   result = value × (source unit in sq ft) ÷ (target unit in sq ft)
//
// Metric units are derived from the exact international foot (0.3048 m),
// so 1 sq ft = 0.09290304 sq m exactly.

export const SQM_PER_SQFT = 0.09290304;
export const SQFT_PER_SQM = 1 / SQM_PER_SQFT; // 10.7639104167…

// The kuzhi (குழி) is not the same everywhere in Tamil Nadu.
// Both conventions agree on ma, kani and veli; only the kuzhi differs.
export const KUZHI_STANDARDS = {
  k144: {
    id: 'k144',
    sqft: 144,
    side: 12,
    ta: '144 ச.அடி (12 × 12 அடி)',
    en: '144 sq ft (12 × 12 ft)',
    noteTa: '12 அடி × 12 அடி. 100 குழி = 1 மா. இன்று பெரும்பாலும் இதுவே வழக்கில் உள்ளது.',
    noteEn: '12 ft × 12 ft. 100 kuzhi = 1 ma. The most common value today.',
  },
  k576: {
    id: 'k576',
    sqft: 576,
    side: 24,
    ta: '576 ச.அடி (24 × 24 அடி)',
    en: '576 sq ft (24 × 24 ft)',
    noteTa: '24 அடி × 24 அடி (ஒரு சதுரக் கோல்). 100 குழி = 1 காணி. பழைய சென்னை மாகாண வழக்கு.',
    noteEn: '24 ft × 24 ft (one square kol). 100 kuzhi = 1 kani. Older Madras Presidency usage.',
  },
};

export const DEFAULT_KUZHI = 'k144';

export const GROUPS = [
  { id: 'tamil', ta: 'தமிழ் பாரம்பரிய அளவுகள்', en: 'Traditional Tamil units', shortTa: 'பாரம்பரியம்', shortEn: 'Tamil' },
  { id: 'everyday', ta: 'தமிழ்நாட்டு அன்றாட அளவுகள்', en: 'Everyday in Tamil Nadu', shortTa: 'அன்றாடம்', shortEn: 'Everyday' },
  { id: 'metric', ta: 'மெட்ரிக் அளவுகள் (அரசுப் பதிவேடுகள்)', en: 'Metric (government records)', shortTa: 'மெட்ரிக்', shortEn: 'Metric' },
  { id: 'imperial', ta: 'ஆங்கில மற்றும் நில அளவைக் கணக்குகள்', en: 'Imperial and survey units', shortTa: 'ஆங்கிலம்', shortEn: 'Imperial' },
  { id: 'southIndia', ta: 'பிற தென்னிந்திய அளவுகள்', en: 'Other South Indian units', shortTa: 'தென்னிந்தியா', shortEn: 'South India' },
];

// Static units (everything except kuzhi, which depends on the chosen standard).
const STATIC_UNITS = [
  // Traditional Tamil
  {
    id: 'ma', group: 'tamil', sqft: 14400,
    ta: 'மா', en: 'Ma', abbrTa: 'மா', abbrEn: 'ma',
    noteTa: '14,400 ச.அடி. 20 மா = 1 வேலி.',
    noteEn: '14,400 sq ft. 20 ma = 1 veli.',
  },
  {
    id: 'kani', group: 'tamil', sqft: 57600,
    ta: 'காணி', en: 'Kani', abbrTa: 'காணி', abbrEn: 'kani',
    noteTa: '4 மா ≈ 1.32 ஏக்கர்.',
    noteEn: '4 ma ≈ 1.32 acres.',
  },
  {
    id: 'veli', group: 'tamil', sqft: 288000,
    ta: 'வேலி', en: 'Veli', abbrTa: 'வேலி', abbrEn: 'veli',
    noteTa: '5 காணி = 20 மா ≈ 6.61 ஏக்கர்.',
    noteEn: '5 kani = 20 ma ≈ 6.61 acres.',
  },

  // Everyday in Tamil Nadu
  {
    id: 'sqft', group: 'everyday', sqft: 1,
    ta: 'சதுர அடி', en: 'Square foot', abbrTa: 'ச.அடி', abbrEn: 'sq ft',
    noteTa: 'மனை விலைகள் பொதுவாக சதுர அடிக்குச் சொல்லப்படும்.',
    noteEn: 'Plot prices are usually quoted per square foot.',
  },
  {
    id: 'cent', group: 'everyday', sqft: 435.6,
    ta: 'சென்ட்', en: 'Cent', abbrTa: 'சென்ட்', abbrEn: 'cent',
    noteTa: '1/100 ஏக்கர் = 435.6 ச.அடி. வீட்டு மனைகளுக்கு வழக்கமான அளவு.',
    noteEn: '1/100 acre = 435.6 sq ft. The usual unit for house plots; called decimal in eastern India.',
  },
  {
    id: 'ground', group: 'everyday', sqft: 2400,
    ta: 'கிரவுண்ட் (மனை)', en: 'Ground', abbrTa: 'கிரவுண்ட்', abbrEn: 'ground',
    noteTa: '2,400 ச.அடி. சென்னையில் வழக்கம். 1 கிரவுண்ட் ≈ 5.51 சென்ட், 5 அல்ல.',
    noteEn: '2,400 sq ft, used for plots in Chennai. About 5.51 cents, not 5.',
  },
  {
    id: 'acre', group: 'everyday', sqft: 43560,
    ta: 'ஏக்கர்', en: 'Acre', abbrTa: 'ஏக்கர்', abbrEn: 'ac',
    noteTa: '43,560 ச.அடி = 100 சென்ட். விவசாய நிலத்திற்கு.',
    noteEn: '43,560 sq ft = 100 cents. Used for farmland.',
  },

  // Metric
  {
    id: 'sqm', group: 'metric', sqft: SQFT_PER_SQM,
    ta: 'சதுர மீட்டர்', en: 'Square metre', abbrTa: 'ச.மீ', abbrEn: 'sq m',
    noteTa: 'கட்டட அனுமதி வரைபடங்களில் பயன்படும். 1 ச.மீ ≈ 10.764 ச.அடி.',
    noteEn: 'Used in building plan approvals. 1 sq m ≈ 10.764 sq ft.',
  },
  {
    id: 'are', group: 'metric', sqft: 100 * SQFT_PER_SQM,
    ta: 'ஏர்', en: 'Are', abbrTa: 'ஏர்', abbrEn: 'a',
    noteTa: '100 ச.மீ. பட்டா, சிட்டாவில் ஹெக்டேருடன் சேர்த்து எழுதப்படும். ஏக்கருடன் குழப்ப வேண்டாம்.',
    noteEn: '100 sq m. Written with hectares in patta and chitta. Not the same as an acre.',
  },
  {
    id: 'hectare', group: 'metric', sqft: 10000 * SQFT_PER_SQM,
    ta: 'ஹெக்டேர்', en: 'Hectare', abbrTa: 'ஹெ', abbrEn: 'ha',
    noteTa: '10,000 ச.மீ = 100 ஏர் ≈ 2.47 ஏக்கர்.',
    noteEn: '10,000 sq m = 100 ares ≈ 2.47 acres.',
  },
  {
    id: 'sqkm', group: 'metric', sqft: 1e6 * SQFT_PER_SQM,
    ta: 'சதுர கிலோமீட்டர்', en: 'Square kilometre', abbrTa: 'ச.கி.மீ', abbrEn: 'sq km',
    noteTa: '100 ஹெக்டேர்.',
    noteEn: '100 hectares.',
  },

  // Imperial and survey
  {
    id: 'sqin', group: 'imperial', sqft: 1 / 144,
    ta: 'சதுர அங்குலம்', en: 'Square inch', abbrTa: 'ச.அங்', abbrEn: 'sq in',
    noteTa: '1/144 ச.அடி.',
    noteEn: '1/144 sq ft.',
  },
  {
    id: 'sqyd', group: 'imperial', sqft: 9,
    ta: 'சதுர கெஜம்', en: 'Square yard', abbrTa: 'ச.கெஜம்', abbrEn: 'sq yd',
    noteTa: '9 ச.அடி. ஆந்திரா, தெலங்கானாவில் மனைகளுக்கு வழக்கம் (வட இந்தியாவில் "கஜ்").',
    noteEn: '9 sq ft. Common for plots in Andhra Pradesh and Telangana (gaj in the north).',
  },
  {
    id: 'perch', group: 'imperial', sqft: 272.25,
    ta: 'பெர்ச்', en: 'Perch (sq rod)', abbrTa: 'பெர்ச்', abbrEn: 'perch',
    noteTa: '16.5 அடி × 16.5 அடி. 160 பெர்ச் = 1 ஏக்கர்.',
    noteEn: '16.5 ft × 16.5 ft. 160 perches = 1 acre.',
  },
  {
    id: 'sqchain', group: 'imperial', sqft: 4356,
    ta: 'சதுர சங்கிலி', en: 'Square chain', abbrTa: 'ச.சங்', abbrEn: 'sq ch',
    noteTa: 'நில அளவைச் சங்கிலி (66 அடி) சதுரம் = 10 சென்ட்.',
    noteEn: "Gunter's survey chain (66 ft) squared = 10 cents.",
  },
  {
    id: 'rood', group: 'imperial', sqft: 10890,
    ta: 'ரூட்', en: 'Rood', abbrTa: 'ரூட்', abbrEn: 'rood',
    noteTa: 'கால் ஏக்கர் = 40 பெர்ச்.',
    noteEn: 'Quarter acre = 40 perches.',
  },
  {
    id: 'sqmile', group: 'imperial', sqft: 27878400,
    ta: 'சதுர மைல்', en: 'Square mile', abbrTa: 'ச.மைல்', abbrEn: 'sq mi',
    noteTa: '640 ஏக்கர்.',
    noteEn: '640 acres.',
  },

  // Other South Indian
  {
    id: 'guntha', group: 'southIndia', sqft: 1089,
    ta: 'குண்டா', en: 'Guntha', abbrTa: 'குண்டா', abbrEn: 'guntha',
    noteTa: '1/40 ஏக்கர் = 1,089 ச.அடி. கர்நாடகா, தெலங்கானா, மகாராஷ்டிரா.',
    noteEn: '1/40 acre = 1,089 sq ft. Karnataka, Telangana, Maharashtra.',
  },
  {
    id: 'ankanam', group: 'southIndia', sqft: 72,
    ta: 'அங்கணம்', en: 'Ankanam', abbrTa: 'அங்கணம்', abbrEn: 'ankanam',
    noteTa: '72 ச.அடி (8 ச.கெஜம்). ஆந்திரப் பிரதேசம்.',
    noteEn: '72 sq ft (8 sq yd). Andhra Pradesh.',
  },
];

function kuzhiUnit(standardId) {
  const std = KUZHI_STANDARDS[standardId] ?? KUZHI_STANDARDS[DEFAULT_KUZHI];
  return {
    id: 'kuzhi',
    group: 'tamil',
    sqft: std.sqft,
    ta: 'குழி',
    en: 'Kuzhi',
    abbrTa: 'குழி',
    abbrEn: 'kuzhi',
    noteTa: std.noteTa,
    noteEn: std.noteEn,
  };
}

/** Full unit list for a kuzhi standard, in display order. */
export function buildUnits(kuzhiStandard = DEFAULT_KUZHI) {
  return [kuzhiUnit(kuzhiStandard), ...STATIC_UNITS];
}

/** Map of unit id → unit for a kuzhi standard. */
export function unitMap(kuzhiStandard = DEFAULT_KUZHI) {
  return Object.fromEntries(buildUnits(kuzhiStandard).map((u) => [u.id, u]));
}

export function unitName(unit, lang) {
  return lang === 'ta' ? unit.ta : unit.en;
}

/** Name without its parenthetical, for chips and tight cells ("கிரவுண்ட் (மனை)" → "கிரவுண்ட்"). */
export function unitShortName(unit, lang) {
  return unitName(unit, lang).replace(/\s*\(.*\)\s*$/, '');
}

export function unitAltName(unit, lang) {
  return lang === 'ta' ? unit.en : unit.ta;
}

export function unitAbbr(unit, lang) {
  return lang === 'ta' ? unit.abbrTa : unit.abbrEn;
}

export function unitNote(unit, lang) {
  return lang === 'ta' ? unit.noteTa : unit.noteEn;
}

// Length units for the plot-area calculator, in feet.
export const LENGTH_UNITS = [
  { id: 'ft', feet: 1, ta: 'அடி', en: 'Feet', abbrTa: 'அடி', abbrEn: 'ft' },
  { id: 'm', feet: 1 / 0.3048, ta: 'மீட்டர்', en: 'Metres', abbrTa: 'மீ', abbrEn: 'm' },
  { id: 'yd', feet: 3, ta: 'கெஜம்', en: 'Yards', abbrTa: 'கெஜம்', abbrEn: 'yd' },
  { id: 'link', feet: 0.66, ta: 'கண்ணி (லிங்க்)', en: 'Links', abbrTa: 'கண்ணி', abbrEn: 'lk' },
];
