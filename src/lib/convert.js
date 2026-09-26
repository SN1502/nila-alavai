import { SQM_PER_SQFT, KUZHI_STANDARDS, DEFAULT_KUZHI } from './units.js';

/** Convert a value between two units (each with a `sqft` size). */
export function convert(value, fromUnit, toUnit) {
  return (value * fromUnit.sqft) / toUnit.sqft;
}

/** Convert one value into every unit in the list. Returns [{ unit, value }]. */
export function convertAll(value, fromUnit, units) {
  const sqft = value * fromUnit.sqft;
  return units.map((unit) => ({ unit, value: sqft / unit.sqft }));
}

/**
 * Parse a typed area. Accepts "2.5", "43,560", "1/2", "1 1/2" and ".75".
 * Returns { ok: true, value } or { ok: false, reason: 'empty' | 'invalid' | 'negative' }.
 */
export function parseAmount(raw) {
  if (raw == null) return { ok: false, reason: 'empty' };
  const text = String(raw).trim().replace(/[, ]/g, '').replace(/\s+/g, ' ');
  if (text === '') return { ok: false, reason: 'empty' };

  let value;
  const mixed = text.match(/^(-?\d+) (\d+)\/(\d+)$/);
  const fraction = text.match(/^(-?\d*\.?\d+)\/(\d*\.?\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const frac = Number(mixed[2]) / Number(mixed[3]);
    value = whole < 0 ? whole - frac : whole + frac;
  } else if (fraction) {
    value = Number(fraction[1]) / Number(fraction[2]);
  } else if (/^-?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(text)) {
    value = Number(text);
  } else {
    return { ok: false, reason: 'invalid' };
  }

  if (!Number.isFinite(value)) return { ok: false, reason: 'invalid' };
  if (value < 0) return { ok: false, reason: 'negative' };
  return { ok: true, value };
}

const formatterCache = new Map();
function getFormatter(key, options) {
  if (!formatterCache.has(key)) formatterCache.set(key, new Intl.NumberFormat('en-IN', options));
  return formatterCache.get(key);
}

/**
 * Format with Indian digit grouping (1,00,000). Very small values switch to
 * significant digits so they don't collapse to 0; very large ones to
 * scientific notation.
 */
export function formatNumber(value, decimals = 4) {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e15) return value.toExponential(4).replace('e+', ' × 10^');
  const threshold = 10 ** -decimals;
  if (abs < threshold) {
    if (abs < 1e-9) return value.toExponential(3).replace('e-', ' × 10^-');
    return getFormatter(`sig`, { maximumSignificantDigits: 4 }).format(value);
  }
  return getFormatter(`fd${decimals}`, { maximumFractionDigits: decimals }).format(value);
}

/**
 * Split an area into whole larger units plus a remainder in the smallest unit.
 * Works in integer hundredths of the smallest unit so float noise can't
 * produce results like "2 ma 99.9999 kuzhi".
 *
 * parts: largest first, e.g. [{ id:'acre', size: 100 }, { id:'cent', size: 1 }]
 * where `size` is how many of the smallest unit make one of this unit.
 */
export function decompose(amountInSmallest, parts) {
  const scale = 100;
  let remaining = Math.round(amountInSmallest * scale);
  return parts.map((part, i) => {
    const isLast = i === parts.length - 1;
    const unitScaled = part.size * scale;
    if (isLast) return { id: part.id, value: remaining / scale };
    const whole = Math.floor(remaining / unitScaled);
    remaining -= whole * unitScaled;
    return { id: part.id, value: whole };
  });
}

/** Acre + cent, the way farmland is described (e.g. "2 ஏக்கர் 35 சென்ட்"). */
export function acreCent(sqft) {
  return decompose(sqft / 435.6, [
    { id: 'acre', size: 100 },
    { id: 'cent', size: 1 },
  ]);
}

/** Hectare – Are, as written in patta and chitta (e.g. "0 – 40.47"). */
export function hectareAre(sqft) {
  const ares = (sqft * SQM_PER_SQFT) / 100;
  return decompose(ares, [
    { id: 'hectare', size: 100 },
    { id: 'are', size: 1 },
  ]);
}

/** Ground + square feet, the way Chennai plots are described. */
export function groundSqft(sqft) {
  return decompose(sqft, [
    { id: 'ground', size: 2400 },
    { id: 'sqft', size: 1 },
  ]);
}

/**
 * Traditional breakdown. With the 144 sq ft kuzhi: veli – ma – kuzhi
 * (100 kuzhi = 1 ma, 20 ma = 1 veli). With the 576 sq ft kuzhi:
 * veli – kani – kuzhi (100 kuzhi = 1 kani, 5 kani = 1 veli).
 */
export function traditional(sqft, kuzhiStandard = DEFAULT_KUZHI) {
  const std = KUZHI_STANDARDS[kuzhiStandard] ?? KUZHI_STANDARDS[DEFAULT_KUZHI];
  const kuzhi = sqft / std.sqft;
  if (std.id === 'k576') {
    return decompose(kuzhi, [
      { id: 'veli', size: 500 },
      { id: 'kani', size: 100 },
      { id: 'kuzhi', size: 1 },
    ]);
  }
  return decompose(kuzhi, [
    { id: 'veli', size: 2000 },
    { id: 'ma', size: 100 },
    { id: 'kuzhi', size: 1 },
  ]);
}

/** Relationship chain shown in the reference table for a kuzhi standard. */
export function traditionalChain(kuzhiStandard = DEFAULT_KUZHI) {
  if (kuzhiStandard === 'k576') {
    return [
      { count: 25, from: 'kuzhi', to: 'ma' },
      { count: 100, from: 'kuzhi', to: 'kani' },
      { count: 4, from: 'ma', to: 'kani' },
      { count: 5, from: 'kani', to: 'veli' },
    ];
  }
  return [
    { count: 100, from: 'kuzhi', to: 'ma' },
    { count: 4, from: 'ma', to: 'kani' },
    { count: 5, from: 'kani', to: 'veli' },
    { count: 20, from: 'ma', to: 'veli' },
  ];
}
