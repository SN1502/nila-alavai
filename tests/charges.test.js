import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_CHARGES,
  parseChargeSettings,
  computeCharges,
  isChargeSettings,
  normalizeChargeSettings,
} from '../src/lib/charges.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} ≠ ${b}`);

test('default charges on a ₹10 lakh land price', () => {
  const { values, invalid } = parseChargeSettings(DEFAULT_CHARGES);
  assert.equal(invalid.size, 0);
  const c = computeCharges(1000000, values);
  close(c.govtValue, 1400000); // + 40%
  close(c.stamp, 98000); // 7% of government value
  close(c.registration, 28000); // 2% of government value
  close(c.fixed, 1500 + 1500 + 10 + 100);
  close(c.totalCharges, 98000 + 28000 + 3110);
  close(c.taxAmount, 0);
  close(c.totalWithTax, 129110);
});

test('every percentage and fee can change', () => {
  const { values } = parseChargeSettings({
    govtMarkup: '0',
    stamp: '5',
    registration: '1',
    computer: '2k',
    online: '',
    nalaNithi: '10',
    video: '₹250',
  });
  const c = computeCharges(2000000, values);
  close(c.govtValue, 2000000);
  close(c.stamp, 100000);
  close(c.registration, 20000);
  close(c.fixed, 2000 + 0 + 10 + 250);
});

test('bad entries are flagged and counted as zero', () => {
  const { values, invalid } = parseChargeSettings({ ...DEFAULT_CHARGES, stamp: 'seven', video: '-100' });
  assert.ok(invalid.has('stamp'));
  assert.ok(invalid.has('video'));
  assert.equal(values.stamp, 0);
  assert.equal(values.video, 0);
});

test('stored settings are validated', () => {
  assert.ok(isChargeSettings(DEFAULT_CHARGES));
  assert.ok(!isChargeSettings({ stamp: '7' }));
  assert.ok(!isChargeSettings(null));
});

test('stamp duty and registration cover the building too', () => {
  const { values } = parseChargeSettings(DEFAULT_CHARGES);
  const c = computeCharges(1000000, values, 500000);
  close(c.govtValue, 1400000);
  close(c.dutyBase, 1900000);
  close(c.stamp, 133000);
  close(c.registration, 38000);
  close(c.totalCharges, 133000 + 38000 + 3110);
  assert.equal('grandTotal' in c, false);
});

test('tax is a percentage of the total registration cost, or a fixed amount', () => {
  const pct = parseChargeSettings({ ...DEFAULT_CHARGES, tax: '18', taxMode: 'percent' });
  const a = computeCharges(1000000, pct.values);
  close(a.taxAmount, 129110 * 0.18);
  close(a.totalWithTax, 129110 * 1.18);

  const fixed = parseChargeSettings({ ...DEFAULT_CHARGES, tax: '2,500', taxMode: 'fixed' });
  const b = computeCharges(1000000, fixed.values);
  close(b.taxAmount, 2500);
  close(b.totalWithTax, 129110 + 2500);

  const bad = parseChargeSettings({ ...DEFAULT_CHARGES, tax: 'abc' });
  assert.ok(bad.invalid.has('tax'));
});

test('settings saved before the tax line existed still load', () => {
  const old = { govtMarkup: '35', stamp: '7', registration: '2', computer: '1500', online: '1500', nalaNithi: '10', video: '100' };
  assert.ok(isChargeSettings(old));
  const n = normalizeChargeSettings(old);
  assert.equal(n.govtMarkup, '35');
  assert.equal(n.tax, '0');
  assert.equal(n.taxMode, 'percent');
  assert.ok(!isChargeSettings({ ...old, taxMode: 'weird' }));
});
