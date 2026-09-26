import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_BUILDING, computeBuilding, isBuildingSettings } from '../src/lib/building.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} ≠ ${b}`);
const withChanges = (changes) => ({ ...structuredClone(DEFAULT_BUILDING), ...changes });

test('new RCC house with tiles: area × (construction + floor) + wiring', () => {
  const b = computeBuilding(withChanges({ area: '1000', age: '0' }));
  close(b.structure, 1000 * (1800 + 120));
  close(b.depreciation, 0);
  close(b.wiring, 1920000 * 0.05);
  close(b.total, 1920000 + 96000);
});

test('depreciation grows with age and stops at the minimum value', () => {
  const tenYears = computeBuilding(withChanges({ age: '10', wiringPercent: '0' }));
  close(tenYears.deprPercent, 10);
  close(tenYears.structureNet, 1920000 * 0.9);

  const old = computeBuilding(withChanges({ age: '100', wiringPercent: '0' }));
  close(old.deprPercent, 70); // minimum value 30% is kept
  close(old.structureNet, 1920000 * 0.3);
});

test('electricity, extras, well and trees add up', () => {
  const s = withChanges({
    area: '500',
    constructionType: 'tiled',
    floorType: 'cement',
    age: '0',
    ebConnection: '15k',
    wiringPercent: '0',
    compoundWall: '1.2L',
    sump: '40000',
    borewell: '75000',
    well: '50000',
    treeCounts: { coconut: '10', mango: '2', teak: '', other: '3' },
  });
  const b = computeBuilding(s);
  close(b.structure, 500 * (1100 + 40));
  close(b.electricity, 15000);
  close(b.extras, 120000 + 40000 + 75000 + 50000);
  close(b.trees, 10 * 5000 + 2 * 8000 + 3 * 2000);
  assert.equal(b.treeCount, 15);
  close(b.total, 570000 + 15000 + 285000 + 72000);
});

test('bad entries are flagged and counted as zero', () => {
  const b = computeBuilding(withChanges({ area: 'abc', well: '-5' }));
  assert.ok(b.invalid.has('area'));
  assert.ok(b.invalid.has('well'));
  close(b.structure, 0);
});

test('stored settings are validated', () => {
  assert.ok(isBuildingSettings(DEFAULT_BUILDING));
  assert.ok(!isBuildingSettings({ enabled: true }));
  assert.ok(!isBuildingSettings(withChanges({ floorType: 'gold' })));
});
