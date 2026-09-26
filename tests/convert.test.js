import { test } from 'node:test';
import assert from 'node:assert/strict';

import { unitMap, buildUnits, SQFT_PER_SQM } from '../src/lib/units.js';
import {
  convert,
  convertAll,
  parseAmount,
  formatNumber,
  acreCent,
  hectareAre,
  groundSqft,
  traditional,
} from '../src/lib/convert.js';
import { triangleArea, quadrilateralArea, rectangleArea } from '../src/lib/geometry.js';

const U = unitMap('k144');
const U576 = unitMap('k576');
const close = (actual, expected, tol = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.max(1, Math.abs(expected)), `${actual} ≠ ${expected}`);

test('acre, cent, ground and square feet', () => {
  close(convert(1, U.acre, U.cent), 100);
  close(convert(1, U.acre, U.sqft), 43560);
  close(convert(1, U.cent, U.sqft), 435.6);
  close(convert(1, U.ground, U.cent), 5.509641873278237);
  close(convert(10, U.cent, U.sqft), 4356);
  close(convert(1, U.sqchain, U.cent), 10);
});

test('metric units', () => {
  close(SQFT_PER_SQM, 10.763910416709722);
  close(convert(1, U.hectare, U.acre), 2.471053814671653);
  close(convert(1, U.acre, U.sqm), 4046.8564224);
  close(convert(1, U.are, U.sqm), 100);
  close(convert(1, U.hectare, U.are), 100);
  close(convert(1, U.sqkm, U.hectare), 100);
  close(convert(1, U.are, U.cent), 2.4710538146716536);
});

test('imperial and South Indian units', () => {
  close(convert(1, U.sqmile, U.acre), 640);
  close(convert(160, U.perch, U.acre), 1);
  close(convert(4, U.rood, U.acre), 1);
  close(convert(40, U.guntha, U.acre), 1);
  close(convert(1, U.ankanam, U.sqyd), 8);
  close(convert(1, U.sqft, U.sqin), 144);
});

test('traditional Tamil units, 144 sq ft kuzhi', () => {
  close(convert(1, U.ma, U.kuzhi), 100);
  close(convert(1, U.kani, U.ma), 4);
  close(convert(1, U.veli, U.kani), 5);
  close(convert(1, U.veli, U.ma), 20);
  close(convert(1, U.veli, U.acre), 6.6115702479338845);
  close(convert(1, U.kani, U.acre), 1.322314049586777);
  close(convert(1, U.acre, U.kuzhi), 302.5);
});

test('traditional Tamil units, 576 sq ft kuzhi', () => {
  close(convert(1, U576.kani, U576.kuzhi), 100);
  close(convert(1, U576.ma, U576.kuzhi), 25);
  close(convert(1, U576.acre, U576.kuzhi), 75.625);
  // ma, kani and veli do not change with the kuzhi standard
  close(convert(1, U576.veli, U576.acre), convert(1, U.veli, U.acre));
});

test('convertAll covers every unit and round-trips', () => {
  const units = buildUnits('k144');
  const results = convertAll(2.5, U.acre, units);
  assert.equal(results.length, units.length);
  for (const { unit, value } of results) close(convert(value, unit, U.acre), 2.5);
});

test('parseAmount', () => {
  assert.deepEqual(parseAmount('2.5'), { ok: true, value: 2.5 });
  assert.deepEqual(parseAmount('43,560'), { ok: true, value: 43560 });
  assert.deepEqual(parseAmount('1/2'), { ok: true, value: 0.5 });
  assert.deepEqual(parseAmount('1 1/2'), { ok: true, value: 1.5 });
  assert.deepEqual(parseAmount('.75'), { ok: true, value: 0.75 });
  assert.deepEqual(parseAmount('  '), { ok: false, reason: 'empty' });
  assert.deepEqual(parseAmount('abc'), { ok: false, reason: 'invalid' });
  assert.deepEqual(parseAmount('1/0'), { ok: false, reason: 'invalid' });
  assert.deepEqual(parseAmount('-4'), { ok: false, reason: 'negative' });
});

test('formatNumber uses Indian grouping and keeps tiny values visible', () => {
  assert.equal(formatNumber(288000, 2), '2,88,000');
  assert.equal(formatNumber(4046.8564224, 2), '4,046.86');
  assert.equal(formatNumber(0.00002, 4), '0.00002');
  assert.equal(formatNumber(0, 4), '0');
  assert.match(formatNumber(1 / 144 / 27878400, 4), /× 10\^-10$/);
});

test('breakdowns', () => {
  assert.deepEqual(acreCent(43560 * 2.35), [
    { id: 'acre', value: 2 },
    { id: 'cent', value: 35 },
  ]);
  assert.deepEqual(hectareAre(43560), [
    { id: 'hectare', value: 0 },
    { id: 'are', value: 40.47 },
  ]);
  assert.deepEqual(groundSqft(5000), [
    { id: 'ground', value: 2 },
    { id: 'sqft', value: 200 },
  ]);
  assert.deepEqual(traditional(43560, 'k144'), [
    { id: 'veli', value: 0 },
    { id: 'ma', value: 3 },
    { id: 'kuzhi', value: 2.5 },
  ]);
  assert.deepEqual(traditional(288000 + 57600 + 576 * 3, 'k576'), [
    { id: 'veli', value: 1 },
    { id: 'kani', value: 1 },
    { id: 'kuzhi', value: 3 },
  ]);
  // No float noise such as 99.99999 cents
  assert.deepEqual(acreCent(43560 * 0.3 + 43560 * 0.7), [
    { id: 'acre', value: 1 },
    { id: 'cent', value: 0 },
  ]);
});

test('plot geometry', () => {
  assert.equal(rectangleArea(40, 60), 2400);
  close(triangleArea(3, 4, 5), 6);
  assert.equal(triangleArea(1, 2, 3), null);
  assert.equal(triangleArea(0, 2, 2), null);
  const square = quadrilateralArea(10, 10, 10, 10, Math.SQRT2 * 10);
  close(square.area, 100, 1e-9);
  assert.equal(quadrilateralArea(10, 10, 1, 1, 14).failed, 2);
});
