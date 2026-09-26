// Registration costs on top of the land price.
//
//   government value  = land price × (1 + markup %)
//   duty base         = government value + building value (0 when there is no building)
//   stamp duty        = duty base × stamp %
//   registration fee  = duty base × registration %
//   fixed fees        = computer + nala nithi + video + online
//   total charges     = stamp duty + registration fee + fixed fees
//   tax               = total charges × tax %   (or a fixed ₹ amount)
//   total with tax    = total charges + tax
//
// Every percentage and fee is editable because they change over time and by office.

import { parseAmount } from './convert.js';
import { parsePrice } from './price.js';

export const DEFAULT_CHARGES = {
  govtMarkup: '40',
  stamp: '7',
  registration: '2',
  computer: '1500',
  nalaNithi: '10',
  video: '100',
  online: '1500',
  tax: '0',
  taxMode: 'percent',
};

// Display order: fees first, online fee last, then tax below the total.
export const CHARGE_FIELDS = [
  { id: 'govtMarkup', kind: 'percent' },
  { id: 'stamp', kind: 'percent' },
  { id: 'registration', kind: 'percent' },
  { id: 'computer', kind: 'fixed' },
  { id: 'nalaNithi', kind: 'fixed' },
  { id: 'video', kind: 'fixed' },
  { id: 'online', kind: 'fixed' },
];

const TAX_MODES = ['percent', 'fixed'];

/**
 * True when a stored settings object is usable. Settings saved before the tax
 * line existed are still accepted; normalizeChargeSettings fills the gaps.
 */
export function isChargeSettings(value) {
  return (
    value != null &&
    typeof value === 'object' &&
    CHARGE_FIELDS.every((f) => typeof value[f.id] === 'string') &&
    (value.tax === undefined || typeof value.tax === 'string') &&
    (value.taxMode === undefined || TAX_MODES.includes(value.taxMode))
  );
}

/** Fill any missing keys with defaults so older saved settings keep working. */
export function normalizeChargeSettings(value) {
  return { ...DEFAULT_CHARGES, ...(isChargeSettings(value) ? value : {}) };
}

/** Parse one setting. Percentages are plain numbers; fees accept 1500, 1.5k, ₹1,500. */
export function parseCharge(field, raw) {
  const parsed = field.kind === 'percent' ? parseAmount(raw) : parsePrice(raw);
  if (parsed.ok) return { ok: true, value: parsed.value };
  // An empty box counts as zero so the rest of the sum still works.
  if (parsed.reason === 'empty') return { ok: true, value: 0, empty: true };
  return { ok: false, value: 0 };
}

/** Parse every setting. Returns { values, invalid: Set of field ids }. */
export function parseChargeSettings(settings) {
  const s = normalizeChargeSettings(settings);
  const values = {};
  const invalid = new Set();
  for (const field of CHARGE_FIELDS) {
    const r = parseCharge(field, s[field.id]);
    values[field.id] = r.value;
    if (!r.ok) invalid.add(field.id);
  }
  const taxMode = TAX_MODES.includes(s.taxMode) ? s.taxMode : 'percent';
  const tax = parseCharge({ kind: taxMode === 'percent' ? 'percent' : 'fixed' }, s.tax);
  values.tax = tax.value;
  values.taxMode = taxMode;
  if (!tax.ok) invalid.add('tax');
  return { values, invalid };
}

/** Work out every line of the registration cost for a land price (and optional building value) in rupees. */
export function computeCharges(landPrice, values, buildingValue = 0) {
  const govtValue = landPrice * (1 + values.govtMarkup / 100);
  const dutyBase = govtValue + buildingValue;
  const stamp = (dutyBase * values.stamp) / 100;
  const registration = (dutyBase * values.registration) / 100;
  const fixed = values.computer + values.nalaNithi + values.video + values.online;
  const totalCharges = stamp + registration + fixed;
  const taxValue = values.tax ?? 0;
  const taxAmount = values.taxMode === 'fixed' ? taxValue : (totalCharges * taxValue) / 100;
  return {
    landPrice,
    govtValue,
    buildingValue,
    dutyBase,
    stamp,
    registration,
    computer: values.computer,
    nalaNithi: values.nalaNithi,
    video: values.video,
    online: values.online,
    fixed,
    totalCharges,
    taxAmount,
    totalWithTax: totalCharges + taxAmount,
  };
}
