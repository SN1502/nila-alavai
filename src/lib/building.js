// Building valuation for land registered with a house or other structures.
//
//   structure        = built-up area × (construction rate + floor rate)
//   depreciation %   = min(age × yearly %, 100 − minimum %)
//   structure (net)  = structure − depreciation
//   electricity      = EB connection + wiring % of structure (net)
//   extras           = compound wall + sump + borewell + well
//   trees            = Σ count × value per tree
//   building total   = structure (net) + electricity + extras + trees
//
// Rates here are SAMPLES. Every one of them is editable in the app.

import { parseAmount } from './convert.js';
import { parsePrice } from './price.js';

export const CONSTRUCTION_TYPES = [
  { id: 'rcc', ta: 'கான்கிரீட் (RCC)', en: 'RCC roof', rate: '1800' },
  { id: 'tiled', ta: 'ஓட்டுக் கூரை', en: 'Tiled roof', rate: '1100' },
  { id: 'sheet', ta: 'ஷீட் கூரை', en: 'Sheet roof', rate: '900' },
  { id: 'thatched', ta: 'ஓலைக் கூரை', en: 'Thatched roof', rate: '400' },
];

export const FLOOR_TYPES = [
  { id: 'cement', ta: 'சிமெண்ட்', en: 'Cement', rate: '40' },
  { id: 'redOxide', ta: 'ரெட் ஆக்சைடு', en: 'Red oxide', rate: '60' },
  { id: 'mosaic', ta: 'மொசைக்', en: 'Mosaic', rate: '90' },
  { id: 'tiles', ta: 'டைல்ஸ்', en: 'Tiles', rate: '120' },
  { id: 'granite', ta: 'கிரானைட்', en: 'Granite', rate: '250' },
  { id: 'marble', ta: 'மார்பிள்', en: 'Marble', rate: '300' },
];

export const TREE_TYPES = [
  { id: 'coconut', ta: 'தென்னை', en: 'Coconut', value: '5000' },
  { id: 'mango', ta: 'மா', en: 'Mango', value: '8000' },
  { id: 'teak', ta: 'தேக்கு', en: 'Teak', value: '15000' },
  { id: 'other', ta: 'மற்ற மரங்கள்', en: 'Other trees', value: '2000' },
];

export const EXTRA_ITEMS = ['compoundWall', 'sump', 'borewell', 'well'];

const byId = (list, key) => Object.fromEntries(list.map((x) => [x.id, x[key]]));

export const DEFAULT_BUILDING = {
  enabled: false,
  area: '1000',
  constructionType: 'rcc',
  constructionRates: byId(CONSTRUCTION_TYPES, 'rate'),
  floorType: 'tiles',
  floorRates: byId(FLOOR_TYPES, 'rate'),
  age: '0',
  deprPerYear: '1',
  minValue: '30',
  ebConnection: '',
  wiringPercent: '5',
  compoundWall: '',
  sump: '',
  borewell: '',
  well: '',
  treeCounts: Object.fromEntries(TREE_TYPES.map((t) => [t.id, ''])),
  treeValues: byId(TREE_TYPES, 'value'),
};

const isStr = (v) => typeof v === 'string';
const hasStrings = (obj, ids) => obj != null && typeof obj === 'object' && ids.every((id) => isStr(obj[id]));

/** True when a stored building settings object has the expected shape. */
export function isBuildingSettings(v) {
  if (v == null || typeof v !== 'object' || typeof v.enabled !== 'boolean') return false;
  const flat = ['area', 'constructionType', 'floorType', 'age', 'deprPerYear', 'minValue', 'ebConnection', 'wiringPercent', ...EXTRA_ITEMS];
  return (
    flat.every((k) => isStr(v[k])) &&
    hasStrings(v.constructionRates, CONSTRUCTION_TYPES.map((t) => t.id)) &&
    hasStrings(v.floorRates, FLOOR_TYPES.map((t) => t.id)) &&
    hasStrings(v.treeCounts, TREE_TYPES.map((t) => t.id)) &&
    hasStrings(v.treeValues, TREE_TYPES.map((t) => t.id)) &&
    CONSTRUCTION_TYPES.some((t) => t.id === v.constructionType) &&
    FLOOR_TYPES.some((t) => t.id === v.floorType)
  );
}

/**
 * Parse a field; empty counts as zero. `kind` is 'number' (area, %, years,
 * counts) or 'money' (accepts 50k, 1.5L, ₹1,500).
 */
function read(raw, kind, key, invalid) {
  const parsed = kind === 'money' ? parsePrice(raw) : parseAmount(raw);
  if (parsed.ok) return parsed.value;
  if (parsed.reason !== 'empty') invalid.add(key);
  return 0;
}

/** Work out every line of the building value. Returns amounts plus a Set of invalid field keys. */
export function computeBuilding(s) {
  const invalid = new Set();
  const area = read(s.area, 'number', 'area', invalid);
  const constructionRate = read(s.constructionRates[s.constructionType], 'money', `constructionRates.${s.constructionType}`, invalid);
  const floorRate = read(s.floorRates[s.floorType], 'money', `floorRates.${s.floorType}`, invalid);
  const age = read(s.age, 'number', 'age', invalid);
  const deprPerYear = read(s.deprPerYear, 'number', 'deprPerYear', invalid);
  const minValue = Math.min(100, read(s.minValue, 'number', 'minValue', invalid));

  const structure = area * (constructionRate + floorRate);
  const deprPercent = Math.max(0, Math.min(age * deprPerYear, 100 - minValue));
  const depreciation = (structure * deprPercent) / 100;
  const structureNet = structure - depreciation;

  const ebConnection = read(s.ebConnection, 'money', 'ebConnection', invalid);
  const wiringPercent = read(s.wiringPercent, 'number', 'wiringPercent', invalid);
  const wiring = (structureNet * wiringPercent) / 100;
  const electricity = ebConnection + wiring;

  const extrasByItem = Object.fromEntries(EXTRA_ITEMS.map((k) => [k, read(s[k], 'money', k, invalid)]));
  const extras = Object.values(extrasByItem).reduce((a, b) => a + b, 0);

  const treesByType = Object.fromEntries(
    TREE_TYPES.map((t) => {
      const count = read(s.treeCounts[t.id], 'number', `treeCounts.${t.id}`, invalid);
      const value = read(s.treeValues[t.id], 'money', `treeValues.${t.id}`, invalid);
      return [t.id, { count, value, amount: count * value }];
    }),
  );
  const trees = Object.values(treesByType).reduce((a, t) => a + t.amount, 0);
  const treeCount = Object.values(treesByType).reduce((a, t) => a + t.count, 0);

  return {
    area,
    constructionRate,
    floorRate,
    structure,
    deprPercent,
    depreciation,
    structureNet,
    ebConnection,
    wiringPercent,
    wiring,
    electricity,
    extrasByItem,
    extras,
    treesByType,
    trees,
    treeCount,
    total: structureNet + electricity + extras + trees,
    invalid,
  };
}
