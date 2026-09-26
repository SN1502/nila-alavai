import React from 'react';
import { acreCent, hectareAre, groundSqft, traditional, formatNumber } from '../lib/convert.js';
import { KUZHI_STANDARDS, unitAbbr } from '../lib/units.js';

/** "3 மா 2.5 குழி" — leading zero parts are dropped, the last part always shows. */
export function describeParts(parts, unitsById, lang) {
  const firstNonZero = parts.findIndex((p) => p.value !== 0);
  const start = firstNonZero === -1 ? parts.length - 1 : Math.min(firstNonZero, parts.length - 1);
  return parts
    .slice(start)
    .map((p, i, arr) => {
      const isLast = i === arr.length - 1;
      const num = formatNumber(p.value, isLast ? 2 : 0);
      // Keep each number with its unit; allow wrapping only between parts.
      return `${num}\u00A0${unitAbbr(unitsById[p.id], lang)}`;
    })
    .join('  ');
}

/** Patta style "0 – 40.47": hectares, then ares with two decimals. */
export function pattaExtent(sqft) {
  const [ha, are] = hectareAre(sqft);
  return `${formatNumber(ha.value, 0)} – ${are.value.toFixed(2)}`;
}

/** The four ways people actually write an extent, as one compact 2×2 card. */
export default function Breakdowns({ sqft, kuzhiStd, unitsById, lang, strings }) {
  const std = KUZHI_STANDARDS[kuzhiStd];
  const cells = [
    { id: 'acreCent', label: strings.bdAcreCent, value: describeParts(acreCent(sqft), unitsById, lang) },
    {
      id: 'patta',
      label: strings.bdHaAre,
      value: pattaExtent(sqft),
      sub: `${unitAbbr(unitsById.hectare, lang)} – ${unitAbbr(unitsById.are, lang)}`,
    },
    { id: 'ground', label: strings.bdGround, value: describeParts(groundSqft(sqft), unitsById, lang) },
    {
      id: 'trad',
      label: strings.bdTraditional,
      value: describeParts(traditional(sqft, kuzhiStd), unitsById, lang),
      sub: `1 ${unitAbbr(unitsById.kuzhi, lang)} = ${std.sqft} ${unitAbbr(unitsById.sqft, lang)}`,
      wideOnly: true,
    },
  ];

  return (
    <section className="formats" aria-labelledby="fmt-title">
      <h2 id="fmt-title" className="sr-only">{strings.breakdownTitle}</h2>
      <dl className="formats-grid">
        {cells.map((c) => (
          <div className="fmt" key={c.id}>
            <dt>{c.label}</dt>
            <dd>
              <span className="num">{c.value}</span>
              {c.sub ? <span className={`fmt-sub${c.wideOnly ? ' fmt-sub--wide' : ''}`}>{c.sub}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
