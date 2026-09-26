// Land price maths. Everything goes through the price of one square foot.

const SUFFIXES = [
  { re: /^(k|thousand|ஆயிரம்)$/, factor: 1e3 },
  { re: /^(l|lac|lacs|lakh|lakhs|லட்சம்|இலட்சம்)$/, factor: 1e5 },
  { re: /^(cr|crore|crores|கோடி)$/, factor: 1e7 },
];

/**
 * Parse a rupee amount. Accepts "1500", "₹15,00,000", "50k", "12L", "12 lakh",
 * "1.2cr", "1.2 கோடி". Returns { ok, value } or { ok: false, reason }.
 */
export function parsePrice(raw) {
  if (raw == null) return { ok: false, reason: 'empty' };
  const text = String(raw).trim().toLowerCase().replace(/[₹,\s ]/g, '').replace(/^rs\.?/, '');
  if (text === '') return { ok: false, reason: 'empty' };
  if (text.startsWith('-')) return { ok: false, reason: 'negative' };

  const match = text.match(/^(\d+\.?\d*|\.\d+)(.*)$/);
  if (!match) return { ok: false, reason: 'invalid' };
  const base = Number(match[1]);
  const suffix = match[2];
  let factor = 1;
  if (suffix) {
    const hit = SUFFIXES.find((s) => s.re.test(suffix));
    if (!hit) return { ok: false, reason: 'invalid' };
    factor = hit.factor;
  }
  const value = base * factor;
  if (!Number.isFinite(value)) return { ok: false, reason: 'invalid' };
  return { ok: true, value };
}

/** Total price of `area` (in areaUnit) at `rate` rupees per rateUnit. */
export function totalPrice(rate, rateUnit, area, areaUnit) {
  return (rate * area * areaUnit.sqft) / rateUnit.sqft;
}

/** Rate per rateUnit when the whole `area` (in areaUnit) costs `total`. Null for zero area. */
export function rateFromTotal(total, area, areaUnit, rateUnit) {
  const sqft = area * areaUnit.sqft;
  if (!(sqft > 0)) return null;
  return (total / sqft) * rateUnit.sqft;
}

/** Re-express a rate per one unit as a rate per another unit. */
export function convertRate(rate, fromUnit, toUnit) {
  return (rate / fromUnit.sqft) * toUnit.sqft;
}

const rupeeWhole = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const rupeePaise = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "₹43,56,000" — whole rupees from ₹100 up or for whole amounts; paise for small fractions. */
export function formatRupees(value) {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const text = abs >= 100 || Number.isInteger(value) ? rupeeWhole.format(value) : rupeePaise.format(value);
  return `₹${text}`;
}

const WORDS = {
  ta: { crore: 'கோடி', lakh: 'லட்சம்', thousand: 'ஆயிரம்' },
  en: { crore: 'crore', lakh: 'lakh', thousand: 'thousand' },
};

function trim2(n) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
}

/** "43.56 லட்சம்" / "6.53 crore". Null below one thousand. */
export function rupeesInWords(value, lang = 'ta') {
  if (!Number.isFinite(value)) return null;
  const w = WORDS[lang] ?? WORDS.ta;
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${trim2(value / 1e7)} ${w.crore}`;
  if (abs >= 1e5) return `${trim2(value / 1e5)} ${w.lakh}`;
  if (abs >= 1e3) return `${trim2(value / 1e3)} ${w.thousand}`;
  return null;
}

/** Like formatRupees, but crores become "₹6.53 கோடி" so they fit narrow cells. */
export function formatRupeesShort(value, lang = 'ta') {
  if (Number.isFinite(value) && Math.abs(value) >= 1e7) {
    const w = WORDS[lang] ?? WORDS.ta;
    return `₹${trim2(value / 1e7)} ${w.crore}`;
  }
  return formatRupees(value);
}

/** A clean editable string for a rupee amount. */
export function toEditableRupees(value) {
  if (!Number.isFinite(value)) return '';
  return String(Math.round(value * 100) / 100);
}
