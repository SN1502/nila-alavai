import React from 'react';
import { CONSTRUCTION_TYPES, FLOOR_TYPES, TREE_TYPES, EXTRA_ITEMS } from '../lib/building.js';
import { formatRupeesShort } from '../lib/price.js';
import { formatNumber } from '../lib/convert.js';

function MiniField({ id, label, value, onChange, prefix, suffix, invalid, className = '' }) {
  return (
    <div className={`mini-field ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      <span className={`mini-input${invalid ? ' is-invalid' : ''}`}>
        {prefix ? <span className="mini-affix">{prefix}</span> : null}
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid}
        />
        {suffix ? <span className="mini-affix">{suffix}</span> : null}
      </span>
    </div>
  );
}

/**
 * Building, well and trees on the land. Everything is entered here and the
 * resulting value feeds the stamp duty base in the registration section.
 */
export default function BuildingPanel({ settings, result, onChange, onToggle, onReset, lang, strings, sqftAbbr }) {
  const B = strings.building;
  const name = (t) => (lang === 'ta' ? t.ta : t.en);
  const bad = (key) => result?.invalid.has(key) ?? false;
  const money = (v) => formatRupeesShort(v, lang);
  const ctype = CONSTRUCTION_TYPES.find((t) => t.id === settings.constructionType) ?? CONSTRUCTION_TYPES[0];
  const ftype = FLOOR_TYPES.find((t) => t.id === settings.floorType) ?? FLOOR_TYPES[0];

  return (
    <section className="panel building" aria-labelledby="building-title">
      <div className="charges-head">
        <h2 id="building-title" className="panel-title">{B.title}</h2>
        <span className="head-actions">
          {settings.enabled ? (
            <button type="button" className="text-btn text-btn--sm" onClick={onReset}>
              {B.reset}
            </button>
          ) : null}
          <button
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            aria-label={B.toggle}
            className="switch"
            onClick={() => onToggle(!settings.enabled)}
          >
            <span className="switch-thumb" aria-hidden="true" />
          </button>
        </span>
      </div>

      {!settings.enabled ? (
        <p className="hint">{B.offHint}</p>
      ) : (
        <>
          <p className="hint">{B.sampleNote}</p>

          <MiniField
            id="b-area"
            className="mini-field--row"
            label={B.area}
            value={settings.area}
            onChange={(v) => onChange('area', v)}
            suffix={sqftAbbr}
            invalid={bad('area')}
          />

          <fieldset className="b-group">
            <legend>{B.constructionType}</legend>
            <div className="chips chips--sm">
              {CONSTRUCTION_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={settings.constructionType === t.id}
                  onClick={() => onChange('constructionType', t.id)}
                >
                  {name(t)}
                </button>
              ))}
            </div>
            <MiniField
              id={`b-crate-${ctype.id}`}
              className="mini-field--row"
              label={`${name(ctype)} · ${B.ratePerSqft}`}
              value={settings.constructionRates[ctype.id]}
              onChange={(v) => onChange(`constructionRates.${ctype.id}`, v)}
              prefix="₹"
              invalid={bad(`constructionRates.${ctype.id}`)}
            />
          </fieldset>

          <fieldset className="b-group">
            <legend>{B.floorType}</legend>
            <div className="chips chips--sm">
              {FLOOR_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={settings.floorType === t.id}
                  onClick={() => onChange('floorType', t.id)}
                >
                  {name(t)}
                </button>
              ))}
            </div>
            <MiniField
              id={`b-frate-${ftype.id}`}
              className="mini-field--row"
              label={`${name(ftype)} · ${B.ratePerSqft}`}
              value={settings.floorRates[ftype.id]}
              onChange={(v) => onChange(`floorRates.${ftype.id}`, v)}
              prefix="₹"
              invalid={bad(`floorRates.${ftype.id}`)}
            />
          </fieldset>

          <div className="b-grid b-grid--3">
            <MiniField id="b-age" label={B.age} value={settings.age} onChange={(v) => onChange('age', v)} invalid={bad('age')} />
            <MiniField
              id="b-depr"
              label={B.deprPerYear}
              value={settings.deprPerYear}
              onChange={(v) => onChange('deprPerYear', v)}
              suffix="%"
              invalid={bad('deprPerYear')}
            />
            <MiniField
              id="b-min"
              label={B.minValue}
              value={settings.minValue}
              onChange={(v) => onChange('minValue', v)}
              suffix="%"
              invalid={bad('minValue')}
            />
          </div>

          <fieldset className="b-group">
            <legend>{B.electricity}</legend>
            <div className="b-grid">
              <MiniField
                id="b-eb"
                label={B.ebConnection}
                value={settings.ebConnection}
                onChange={(v) => onChange('ebConnection', v)}
                prefix="₹"
                invalid={bad('ebConnection')}
              />
              <MiniField
                id="b-wiring"
                label={B.wiringPercent}
                value={settings.wiringPercent}
                onChange={(v) => onChange('wiringPercent', v)}
                suffix="%"
                invalid={bad('wiringPercent')}
              />
            </div>
          </fieldset>

          <fieldset className="b-group">
            <legend>{B.extras}</legend>
            <div className="b-grid">
              {EXTRA_ITEMS.map((key) => (
                <MiniField
                  key={key}
                  id={`b-${key}`}
                  label={B[key]}
                  value={settings[key]}
                  onChange={(v) => onChange(key, v)}
                  prefix="₹"
                  invalid={bad(key)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="b-group">
            <legend>{B.trees}</legend>
            <div className="tree-list">
              {TREE_TYPES.map((t) => (
                <div className="tree-row" key={t.id}>
                  <span className="tree-name">{name(t)}</span>
                  <span className={`mini-input${bad(`treeCounts.${t.id}`) ? ' is-invalid' : ''}`}>
                    <input
                      id={`b-tree-${t.id}`}
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="0"
                      value={settings.treeCounts[t.id]}
                      onChange={(e) => onChange(`treeCounts.${t.id}`, e.target.value)}
                      aria-label={`${name(t)} · ${B.count}`}
                    />
                  </span>
                  <span className="tree-x" aria-hidden="true">×</span>
                  <span className={`mini-input${bad(`treeValues.${t.id}`) ? ' is-invalid' : ''}`}>
                    <span className="mini-affix">₹</span>
                    <input
                      id={`b-treeval-${t.id}`}
                      inputMode="decimal"
                      autoComplete="off"
                      value={settings.treeValues[t.id]}
                      onChange={(e) => onChange(`treeValues.${t.id}`, e.target.value)}
                      aria-label={`${name(t)} · ${B.perTree}`}
                    />
                  </span>
                </div>
              ))}
            </div>
          </fieldset>

          {result ? (
            <div className="charge-list b-summary" aria-label={B.summary}>
              <div className="charge-row charge-row--wide">
                <span className="charge-label">
                  <span>{B.structure}</span>
                  <span className="charge-sub num">
                    {formatNumber(result.area, 2)} × ({money(result.constructionRate)} + {money(result.floorRate)})
                  </span>
                </span>
                <span className="charge-amount num">{money(result.structure)}</span>
              </div>
              {result.depreciation > 0 ? (
                <div className="charge-row charge-row--wide">
                  <span className="charge-label">{B.depreciation(formatNumber(result.deprPercent, 2))}</span>
                  <span className="charge-amount num">−{money(result.depreciation)}</span>
                </div>
              ) : null}
              <div className="charge-row charge-row--wide">
                <span className="charge-label">{B.electricity}</span>
                <span className="charge-amount num">{money(result.electricity)}</span>
              </div>
              <div className="charge-row charge-row--wide">
                <span className="charge-label">{B.extras}</span>
                <span className="charge-amount num">{money(result.extras)}</span>
              </div>
              <div className="charge-row charge-row--wide">
                <span className="charge-label">
                  {B.trees}
                  {result.treeCount > 0 ? ` (${formatNumber(result.treeCount, 0)})` : ''}
                </span>
                <span className="charge-amount num">{money(result.trees)}</span>
              </div>
              <div className="charge-row charge-row--wide charge-row--total">
                <span className="charge-label">{B.totalValue}</span>
                <span className="charge-amount num">{money(result.total)}</span>
              </div>
            </div>
          ) : null}

          {result && result.invalid.size > 0 ? <p className="hint is-error-text">{B.invalid}</p> : null}
        </>
      )}
    </section>
  );
}
