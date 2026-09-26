import React, { useMemo, useRef, useState } from 'react';
import { GROUPS, unitName, unitShortName, unitAltName, unitAbbr, unitNote } from '../lib/units.js';
import { convertAll, parseAmount, formatNumber } from '../lib/convert.js';
import Breakdowns from './Breakdowns.jsx';
import CopyButton from './CopyButton.jsx';
import { EditIcon } from './Icons.jsx';

// Units people switch to most often, shown as one-tap chips under the input.
const QUICK_UNITS = ['acre', 'cent', 'sqft', 'ground', 'kuzhi', 'ma', 'hectare', 'sqm'];

/** A clean editable string for a computed value (no grouping, ~10 significant digits). */
export function toEditable(value) {
  if (!Number.isFinite(value)) return '';
  if (value === 0) return '0';
  const rounded = Number(value.toPrecision(10));
  return Math.abs(rounded) < 1e-6 ? rounded.toExponential() : String(rounded);
}

export function UnitSelect({ id, units, value, onChange, lang, className }) {
  return (
    <select id={id} className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      {GROUPS.map((group) => (
        <optgroup key={group.id} label={lang === 'ta' ? group.ta : group.en}>
          {units
            .filter((u) => u.group === group.id)
            .map((u) => (
              <option key={u.id} value={u.id}>
                {unitName(u, lang)} · {unitAltName(u, lang)}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}

export default function Converter({
  units,
  unitsById,
  lang,
  strings,
  amount,
  onAmountChange,
  fromId,
  onFromChange,
  decimals,
  kuzhiStd,
  isSample,
  notify,
}) {
  const [groupFilter, setGroupFilter] = useState('all');
  const inputRef = useRef(null);
  const cardRef = useRef(null);

  const parsed = parseAmount(amount);
  const from = unitsById[fromId] ?? unitsById.acre;
  const results = useMemo(
    () => (parsed.ok ? convertAll(parsed.value, from, units) : null),
    [parsed.ok, parsed.value, from, units],
  );
  const sqft = parsed.ok ? parsed.value * from.sqft : null;
  const allRows = results ?? units.map((unit) => ({ unit, value: null }));
  const rows = groupFilter === 'all' ? allRows : allRows.filter((r) => r.unit.group === groupFilter);
  const sourceText = parsed.ok ? `${formatNumber(parsed.value, decimals)} ${unitAbbr(from, lang)}` : '';

  function pickTile(unit, value) {
    onFromChange(unit.id);
    onAmountChange(toEditable(value), { keepSample: isSample });
  }

  function editAmount() {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    cardRef.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    inputRef.current?.focus({ preventScroll: true });
    inputRef.current?.select();
  }

  return (
    <div className="converter">
      <div className="conv-side">
        <section className="ink-card source-card" ref={cardRef} aria-label={strings.source}>
          <div className="card-top">
            <label htmlFor="amount" className="card-eyebrow">{strings.amount}</label>
            <span className="card-top-end">
              {isSample && parsed.ok ? <span className="card-tag">{strings.sampleShort}</span> : null}
              {parsed.ok ? (
                <CopyButton
                  className="card-copy"
                  text={sourceText}
                  label={unitName(from, lang)}
                  strings={strings}
                  notify={notify}
                />
              ) : null}
            </span>
          </div>

          <div className="source-row">
            <input
              id="amount"
              ref={inputRef}
              className="amount-input"
              inputMode="decimal"
              autoComplete="off"
              spellCheck="false"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              aria-invalid={!parsed.ok}
              aria-describedby="amount-help"
            />
            <label htmlFor="from-unit" className="sr-only">{strings.fromUnit}</label>
            <UnitSelect
              id="from-unit"
              className="unit-pill"
              units={units}
              value={from.id}
              onChange={onFromChange}
              lang={lang}
            />
          </div>
          <div className="chain-rule" aria-hidden="true" />

          {parsed.ok ? (
            <p id="amount-help" className="card-help card-note">{unitNote(from, lang)}</p>
          ) : (
            <p id="amount-help" className="card-help is-error" role="alert">{strings.errors[parsed.reason]}</p>
          )}

          <div className="quick-chips" role="group" aria-label={strings.quickUnits}>
            {QUICK_UNITS.map((id) => (
              <button key={id} type="button" aria-pressed={from.id === id} onClick={() => onFromChange(id)}>
                {unitShortName(unitsById[id], lang)}
              </button>
            ))}
          </div>
        </section>

        {sqft != null ? (
          <Breakdowns sqft={sqft} kuzhiStd={kuzhiStd} unitsById={unitsById} lang={lang} strings={strings} />
        ) : null}
      </div>

      <section className="conv-results" aria-labelledby="results-title">
        <div className="results-bar">
          <h2 id="results-title" className="results-summary">
            <button type="button" onClick={editAmount} aria-label={strings.editAmount}>
              {parsed.ok ? (
                <>
                  <span className="num">{formatNumber(parsed.value, decimals)}</span>
                  <span className="rs-unit">{unitAbbr(from, lang)}</span>
                  <span className="rs-eq">=</span>
                </>
              ) : (
                <span className="rs-unit">{strings.equals}</span>
              )}
              <span className="rs-edit"><EditIcon /></span>
            </button>
          </h2>
          <div className="group-chips" role="group" aria-label={strings.filterGroups}>
            <button type="button" aria-pressed={groupFilter === 'all'} onClick={() => setGroupFilter('all')}>
              {strings.all}
            </button>
            {GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`group--${g.id}`}
                aria-pressed={groupFilter === g.id}
                onClick={() => setGroupFilter(g.id)}
              >
                <span className="swatch" aria-hidden="true" />
                {lang === 'ta' ? g.shortTa : g.shortEn}
              </button>
            ))}
          </div>
        </div>

        <p className="hint results-hint">{strings.tapHint}</p>

        <ul className="tiles">
          {rows.map(({ unit, value }) => {
            const isSource = unit.id === from.id;
            const shown = value == null ? '—' : formatNumber(value, decimals);
            const abbr = unitAbbr(unit, lang);
            return (
              <li className={`tile group--${unit.group}${isSource ? ' is-source' : ''}`} key={unit.id}>
                <button
                  type="button"
                  className="tile-main"
                  onClick={() => value != null && pickTile(unit, value)}
                  disabled={value == null}
                  aria-current={isSource ? 'true' : undefined}
                  title={unitNote(unit, lang)}
                >
                  <span className="tile-name">
                    <span className="swatch" aria-hidden="true" />
                    <span className="tile-name-text">{unitShortName(unit, lang)}</span>
                  </span>
                  <span className="tile-value">
                    <span className="num">{shown}</span>
                    <span className="tile-abbr">{abbr}</span>
                  </span>
                  <span className="tile-alt">{unitAltName(unit, lang)}</span>
                </button>
                {value != null ? (
                  <CopyButton
                    className="tile-copy"
                    text={`${shown} ${abbr}`}
                    label={unitName(unit, lang)}
                    strings={strings}
                    notify={notify}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
