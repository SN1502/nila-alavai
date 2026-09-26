import React, { useState } from 'react';
import { LENGTH_UNITS, unitAbbr, unitShortName } from '../lib/units.js';
import { parseAmount, formatNumber, convert, traditional } from '../lib/convert.js';
import { rectangleArea, triangleArea, quadrilateralArea } from '../lib/geometry.js';
import { describeParts, pattaExtent } from './Breakdowns.jsx';
import { ShapeIcon } from './Icons.jsx';

// Sample plot so the tab opens with a worked example.
const SAMPLE = {
  rect: { l: '40', b: '60' },
  triangle: { a: '30', b: '40', c: '50' },
  quad: { a: '60', b: '40', c: '58', d: '42', diag: '72' },
};

const FIELDS = {
  rect: ['l', 'b'],
  triangle: ['a', 'b', 'c'],
  quad: ['a', 'b', 'c', 'd', 'diag'],
};

const CARD_UNITS = ['cent', 'ground', 'acre', 'sqm'];

function ShapeDiagram({ shape, strings }) {
  // Illustrative only; not to scale. Colours come from CSS tokens.
  if (shape === 'rect') {
    return (
      <svg className="shape-svg" viewBox="0 0 220 150" role="img" aria-label={strings.shapes.rect}>
        <rect x="34" y="18" width="160" height="100" className="shape-fill" />
        <text x="114" y="142" className="shape-label" textAnchor="middle">{strings.length}</text>
        <text x="18" y="68" className="shape-label" textAnchor="middle" transform="rotate(-90 18 68)">{strings.breadth}</text>
      </svg>
    );
  }
  if (shape === 'triangle') {
    return (
      <svg className="shape-svg" viewBox="0 0 220 150" role="img" aria-label={strings.shapes.triangle}>
        <polygon points="30,125 190,125 70,20" className="shape-fill" />
        <text x="110" y="145" className="shape-label" textAnchor="middle">A</text>
        <text x="142" y="68" className="shape-label" textAnchor="middle">B</text>
        <text x="36" y="72" className="shape-label" textAnchor="middle">C</text>
      </svg>
    );
  }
  return (
    <svg className="shape-svg" viewBox="0 0 220 150" role="img" aria-label={strings.shapes.quad}>
      <polygon points="30,120 185,130 200,30 55,18" className="shape-fill" />
      <line x1="30" y1="120" x2="200" y2="30" className="shape-diag" />
      <text x="108" y="146" className="shape-label" textAnchor="middle">A</text>
      <text x="208" y="86" className="shape-label" textAnchor="middle">B</text>
      <text x="128" y="14" className="shape-label" textAnchor="middle">C</text>
      <text x="26" y="74" className="shape-label" textAnchor="middle">D</text>
      <text x="140" y="100" className="shape-label shape-label--diag" textAnchor="middle">1</text>
      <text x="95" y="62" className="shape-label shape-label--diag" textAnchor="middle">2</text>
    </svg>
  );
}

export default function PlotArea({ unitsById, lang, strings, kuzhiStd, onOpenInConverter, onOpenInPrice }) {
  const [shape, setShape] = useState('rect');
  const [lengthUnitId, setLengthUnitId] = useState('ft');
  const [values, setValues] = useState(SAMPLE);

  const lengthUnit = LENGTH_UNITS.find((u) => u.id === lengthUnitId) ?? LENGTH_UNITS[0];
  const current = values[shape];
  const parsed = Object.fromEntries(FIELDS[shape].map((k) => [k, parseAmount(current[k])]));
  const allValid = FIELDS[shape].every((k) => parsed[k].ok && parsed[k].value > 0);
  const n = (k) => parsed[k].value;

  let areaInUnit = null;
  let error = null;
  let triangles = null;
  if (!allValid) {
    error = strings.plotErrors.missing;
  } else if (shape === 'rect') {
    areaInUnit = rectangleArea(n('l'), n('b'));
  } else if (shape === 'triangle') {
    areaInUnit = triangleArea(n('a'), n('b'), n('c'));
    if (areaInUnit == null) error = strings.plotErrors.triangle;
  } else {
    const q = quadrilateralArea(n('a'), n('b'), n('c'), n('d'), n('diag'));
    if (q.area == null) error = strings.plotErrors.quad(q.failed);
    else {
      areaInUnit = q.area;
      triangles = [q.t1, q.t2];
    }
  }

  const toSqft = (a) => a * lengthUnit.feet * lengthUnit.feet;
  const sqft = areaInUnit == null ? null : toSqft(areaInUnit);
  const sqftAbbr = unitAbbr(unitsById.sqft, lang);

  function setField(key, v) {
    setValues((prev) => ({ ...prev, [shape]: { ...prev[shape], [key]: v } }));
  }

  const fieldLabel = (key) => {
    if (key === 'l') return strings.length;
    if (key === 'b' && shape === 'rect') return strings.breadth;
    if (key === 'diag') return strings.diagonal;
    return `${strings.side} ${key.toUpperCase()}`;
  };

  const hint = shape === 'rect' ? strings.rectHint : shape === 'triangle' ? strings.triangleHint : strings.quadHint;

  return (
    <div className="plot">
      <section className="ink-card plot-card" aria-live="polite" aria-labelledby="plot-total">
        <div className="card-top">
          <span className="card-eyebrow" id="plot-total">{strings.totalArea}</span>
          {sqft != null ? (
            <span className="card-top-end">
              <button
                type="button"
                className="card-link"
                onClick={() => onOpenInConverter(sqft)}
                aria-label={strings.openInConverter}
              >
                {strings.tabs.convert}
                <span aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                className="card-link"
                onClick={() => onOpenInPrice(sqft)}
                aria-label={strings.priceThisPlot}
              >
                ₹ {strings.tabs.price}
                <span aria-hidden="true">→</span>
              </button>
            </span>
          ) : null}
        </div>

        {sqft == null ? (
          <p className="card-help is-error">{error}</p>
        ) : (
          <>
            <p className="plot-total">
              <span className="num">{formatNumber(sqft, 2)}</span>
              <span className="plot-total-unit">{sqftAbbr}</span>
            </p>
            {triangles ? (
              <p className="card-help">
                {triangles
                  .map((tArea, i) => `${strings.triangleArea(i + 1)}: ${formatNumber(toSqft(tArea), 2)}`)
                  .join('  ·  ')}
              </p>
            ) : null}

            <dl className="card-grid">
              {CARD_UNITS.map((id) => {
                const unit = unitsById[id];
                return (
                  <div key={id}>
                    <dt>{unitShortName(unit, lang)}</dt>
                    <dd className="num">{formatNumber(convert(sqft, unitsById.sqft, unit), 4)}</dd>
                  </div>
                );
              })}
              <div>
                <dt>{strings.bdHaAre}</dt>
                <dd className="num">{pattaExtent(sqft)}</dd>
              </div>
              <div>
                <dt>{strings.bdTraditional}</dt>
                <dd className="num">{describeParts(traditional(sqft, kuzhiStd), unitsById, lang)}</dd>
              </div>
            </dl>
          </>
        )}
      </section>

      <section className="panel plot-inputs" aria-labelledby="plot-title">
        <h2 id="plot-title" className="panel-title">{strings.plotTitle}</h2>

        <div className="shape-chips" role="group" aria-label={strings.shape}>
          {Object.keys(FIELDS).map((key) => (
            <button key={key} type="button" aria-pressed={shape === key} onClick={() => setShape(key)}>
              <ShapeIcon shape={key} />
              <span>{strings.shapes[key]}</span>
            </button>
          ))}
        </div>

        <div className="field">
          <span className="eyebrow" id="length-unit-label">{strings.lengthUnit}</span>
          <div className="chips" role="group" aria-labelledby="length-unit-label">
            {LENGTH_UNITS.map((u) => (
              <button key={u.id} type="button" aria-pressed={lengthUnitId === u.id} onClick={() => setLengthUnitId(u.id)}>
                {lang === 'ta' ? u.ta : u.en}
              </button>
            ))}
          </div>
        </div>

        <div className={`side-grid side-grid--${shape}`}>
          {FIELDS[shape].map((key) => {
            const id = `plot-${shape}-${key}`;
            const bad = current[key] !== '' && !(parsed[key].ok && parsed[key].value > 0);
            return (
              <div className={`field field--${key}`} key={id}>
                <label htmlFor={id}>{fieldLabel(key)}</label>
                <div className="suffix-input">
                  <input
                    id={id}
                    inputMode="decimal"
                    autoComplete="off"
                    value={current[key]}
                    onChange={(e) => setField(key, e.target.value)}
                    aria-invalid={bad}
                  />
                  <span>{lang === 'ta' ? lengthUnit.abbrTa : lengthUnit.abbrEn}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="plot-figure">
          <ShapeDiagram shape={shape} strings={strings} />
          <p className="hint">{hint}</p>
        </div>
      </section>
    </div>
  );
}
