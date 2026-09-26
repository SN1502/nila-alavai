import React, { useState } from 'react';
import { GROUPS, KUZHI_STANDARDS, SQM_PER_SQFT, unitName, unitAltName } from '../lib/units.js';
import { formatNumber, traditionalChain } from '../lib/convert.js';

const OTHER_CHAINS = [
  { left: [100, 'cent'], right: [1, 'acre'] },
  { left: [1, 'ground'], right: [5.51, 'cent'], approx: true },
  { left: [1, 'sqchain'], right: [10, 'cent'] },
  { left: [100, 'sqm'], right: [1, 'are'] },
  { left: [100, 'are'], right: [1, 'hectare'] },
  { left: [1, 'hectare'], right: [2.471, 'acre'], approx: true },
  { left: [40, 'guntha'], right: [1, 'acre'] },
  { left: [640, 'acre'], right: [1, 'sqmile'] },
];

function Chain({ left, right, approx, unitsById, lang }) {
  const side = ([count, id]) => (
    <span className="chain-side">
      <span className="num">{formatNumber(count, 3)}</span> {unitName(unitsById[id], lang)}
    </span>
  );
  return (
    <li className="chain">
      {side(left)}
      <span className="chain-eq" aria-hidden="true">{approx ? '≈' : '='}</span>
      <span className="sr-only">{approx ? 'approximately equals' : 'equals'}</span>
      {side(right)}
    </li>
  );
}

export default function Reference({ units, unitsById, lang, strings, kuzhiStd }) {
  const tamilChains = traditionalChain(kuzhiStd).map((c) => ({ left: [c.count, c.from], right: [1, c.to] }));
  const std = KUZHI_STANDARDS[kuzhiStd];
  // Explanations start collapsed on phones so the unit table is on the first screen.
  const [wide] = useState(() => {
    try {
      return window.matchMedia('(min-width: 900px)').matches;
    } catch {
      return true;
    }
  });

  return (
    <div className="reference">
      <details className="panel disclosure ref-how" open={wide}>
        <summary>
          <h2 id="ref-title" className="panel-title">{strings.refTitle}</h2>
        </summary>
        <p className="lede">{strings.refHow}</p>
        <pre className="formula"><code>{strings.refFormula}</code></pre>
        <p className="example">{strings.refExample}</p>
        <p className="hint">{strings.refExact}</p>
      </details>

      <details className="panel disclosure" open={wide}>
        <summary>
          <h2 id="chain-title" className="panel-title">{strings.refChains}</h2>
        </summary>
        <h3 className="eyebrow">
          {lang === 'ta' ? GROUPS[0].ta : GROUPS[0].en} · {lang === 'ta' ? std.ta : std.en}
        </h3>
        <ul className="chains">
          {tamilChains.map((c, i) => (
            <Chain key={`t${i}`} {...c} unitsById={unitsById} lang={lang} />
          ))}
        </ul>
        <p className="hint">{strings.refKuzhi}</p>
        <ul className="chains chains--other">
          {OTHER_CHAINS.map((c, i) => (
            <Chain key={`o${i}`} {...c} unitsById={unitsById} lang={lang} />
          ))}
        </ul>
      </details>

      <section className="panel ref-table" aria-labelledby="table-title">
        <h2 id="table-title" className="panel-title">{strings.refTable}</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">{strings.colUnit}</th>
                <th scope="col" className="n">{strings.colSqft}</th>
                <th scope="col" className="n col-sqm">{strings.colSqm}</th>
                <th scope="col" className="n">{strings.colAcre}</th>
              </tr>
            </thead>
            {GROUPS.map((group) => (
              <tbody key={group.id} className={`group--${group.id}`}>
                <tr className="tgroup">
                  <th scope="rowgroup" colSpan={4}>
                    <span className="swatch" aria-hidden="true" />
                    {lang === 'ta' ? group.ta : group.en}
                  </th>
                </tr>
                {units
                  .filter((u) => u.group === group.id)
                  .map((u) => (
                    <tr key={u.id}>
                      <th scope="row">
                        <span className="nm">{unitName(u, lang)}</span>
                        <span className="alt">{unitAltName(u, lang)}</span>
                      </th>
                      <td className="n num">{formatNumber(u.sqft, 4)}</td>
                      <td className="n num col-sqm">{formatNumber(u.sqft * SQM_PER_SQFT, 4)}</td>
                      <td className="n num">{formatNumber(u.sqft / 43560, 6)}</td>
                    </tr>
                  ))}
              </tbody>
            ))}
          </table>
        </div>
      </section>

      <p className="caution">{strings.refCaution}</p>
    </div>
  );
}
