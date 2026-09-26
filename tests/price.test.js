import { test } from 'node:test';
import assert from 'node:assert/strict';

import { unitMap } from '../src/lib/units.js';
import {
  parsePrice,
  totalPrice,
  rateFromTotal,
  convertRate,
  formatRupees,
  rupeesInWords,
  toEditableRupees,
  formatRupeesShort,
} from '../src/lib/price.js';

const U = unitMap('k144');
const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);

test('parsePrice handles plain numbers, grouping and the rupee sign', () => {
  assert.deepEqual(parsePrice('1500'), { ok: true, value: 1500 });
  assert.deepEqual(parsePrice('₹15,00,000'), { ok: true, value: 1500000 });
  assert.deepEqual(parsePrice('Rs. 2,400'), { ok: true, value: 2400 });
  assert.deepEqual(parsePrice('.5'), { ok: true, value: 0.5 });
});

test('parsePrice understands Indian shorthand in English and Tamil', () => {
  assert.equal(parsePrice('50k').value, 50000);
  assert.equal(parsePrice('12L').value, 1200000);
  assert.equal(parsePrice('12 lakh').value, 1200000);
  assert.equal(parsePrice('4.5 lakhs').value, 450000);
  assert.equal(parsePrice('1.2cr').value, 12000000);
  assert.equal(parsePrice('2 crore').value, 20000000);
  assert.equal(parsePrice('45 லட்சம்').value, 4500000);
  assert.equal(parsePrice('1.5 கோடி').value, 15000000);
});

test('parsePrice rejects bad input', () => {
  assert.deepEqual(parsePrice(''), { ok: false, reason: 'empty' });
  assert.deepEqual(parsePrice('-500'), { ok: false, reason: 'negative' });
  assert.deepEqual(parsePrice('abc'), { ok: false, reason: 'invalid' });
  assert.deepEqual(parsePrice('12 bananas'), { ok: false, reason: 'invalid' });
});

test('total price from a rate', () => {
  // 10 cents at ₹1,500 per sq ft = 4,356 sq ft × 1,500
  close(totalPrice(1500, U.sqft, 10, U.cent), 6534000);
  // 1 ground at ₹60 lakh per ground
  close(totalPrice(6000000, U.ground, 1, U.ground), 6000000);
  // 2.5 acres at ₹40 lakh per acre
  close(totalPrice(4000000, U.acre, 2.5, U.acre), 10000000);
  // 1 acre priced per cent
  close(totalPrice(300000, U.cent, 1, U.acre), 30000000);
});

test('rate from a total', () => {
  // ₹45 lakh for 10 cents → ₹4.5 lakh per cent
  close(rateFromTotal(4500000, 10, U.cent, U.cent), 450000);
  // same deal per sq ft
  close(rateFromTotal(4500000, 10, U.cent, U.sqft), 4500000 / 4356);
  assert.equal(rateFromTotal(100, 0, U.cent, U.sqft), null);
});

test('rates convert between units', () => {
  close(convertRate(1000, U.sqft, U.cent), 435600);
  close(convertRate(1000, U.sqft, U.ground), 2400000);
  close(convertRate(435600, U.cent, U.sqft), 1000);
  close(convertRate(1, U.sqft, U.acre), 43560);
});

test('rupee formatting and words', () => {
  assert.equal(formatRupees(4356000), '₹43,56,000');
  assert.equal(formatRupees(65340000.4), '₹6,53,40,000');
  assert.equal(formatRupees(12.5), '₹12.50');
  assert.equal(formatRupees(0), '₹0');
  assert.equal(formatRupees(10), '₹10');
  assert.equal(rupeesInWords(4356000, 'ta'), '43.56 லட்சம்');
  assert.equal(rupeesInWords(65340000, 'en'), '6.53 crore');
  assert.equal(rupeesInWords(25000, 'en'), '25 thousand');
  assert.equal(rupeesInWords(999, 'en'), null);
  assert.equal(toEditableRupees(1033.0578512396), '1033.06');
  assert.equal(formatRupeesShort(65340000, 'ta'), '₹6.53 கோடி');
  assert.equal(formatRupeesShort(3600000, 'en'), '₹36,00,000');
});
