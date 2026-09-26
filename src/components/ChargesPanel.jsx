import React from 'react';
import { CHARGE_FIELDS, normalizeChargeSettings, parseChargeSettings, computeCharges } from '../lib/charges.js';
import { formatRupeesShort } from '../lib/price.js';

const FIELD_BY_ID = Object.fromEntries(CHARGE_FIELDS.map((f) => [f.id, f]));

function MiniInput({ id, kind, value, onChange, invalid, label, prefix }) {
  const isPercent = kind === 'percent';
  return (
    <span className={`mini-input${invalid ? ' is-invalid' : ''}`}>
      {prefix ? <span className="mini-affix">{prefix}</span> : null}
      {!isPercent ? <span className="mini-affix">₹</span> : null}
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        aria-invalid={invalid}
      />
      {isPercent ? <span className="mini-affix">%</span> : null}
    </span>
  );
}

function EditableRow({ id, label, sub, kind, value, onChange, invalid, amount, prefix, className = '', strings, extra }) {
  const inputId = `charge-${id}`;
  return (
    <div className={`charge-row ${className}`.trim()}>
      <div className="charge-label">
        <label htmlFor={inputId}>{label}</label>
        {sub ? <span className="charge-sub">{sub}</span> : null}
        {extra}
        {invalid ? <span className="charge-err">{strings.charges.invalid}</span> : null}
      </div>
      <span>
        <MiniInput
          id={inputId}
          kind={kind}
          value={value}
          onChange={onChange}
          invalid={invalid}
          label={label}
          prefix={prefix}
        />
      </span>
      <span className="charge-amount num">{amount}</span>
    </div>
  );
}

function StaticRow({ label, amount, className = '' }) {
  return (
    <div className={`charge-row ${className}`.trim()}>
      <span className="charge-label">{label}</span>
      <span aria-hidden="true" />
      <span className="charge-amount num">{amount}</span>
    </div>
  );
}

/**
 * Registration cost breakdown. Each row shows what it is, the editable rate or
 * fee, and the rupee amount it adds, so the whole sum reads top to bottom.
 * Tax sits below the total and applies to it (or is a fixed amount).
 */
export default function ChargesPanel({ landPrice, buildingValue = null, settings: rawSettings, onSettingChange, onReset, lang, strings }) {
  const C = strings.charges;
  const settings = normalizeChargeSettings(rawSettings);
  const { values, invalid } = parseChargeSettings(settings);
  const hasBuilding = buildingValue != null;
  const c = landPrice != null ? computeCharges(landPrice, values, buildingValue ?? 0) : null;
  const money = (v) => (c == null ? '—' : formatRupeesShort(v, lang));
  const dutySub = hasBuilding ? C.ofGovtBuilding : C.ofGovt;
  const taxIsPercent = settings.taxMode !== 'fixed';

  const feeRows = [
    { id: 'stamp', label: C.stamp, sub: dutySub, amount: c?.stamp },
    { id: 'registration', label: C.registration, sub: dutySub, amount: c?.registration },
    { id: 'computer', label: C.computer, amount: c?.computer },
    { id: 'nalaNithi', label: C.nalaNithi, amount: c?.nalaNithi },
    { id: 'video', label: C.video, amount: c?.video },
    { id: 'online', label: C.online, amount: c?.online },
  ];

  return (
    <section className="panel charges" aria-labelledby="charges-title">
      <div className="charges-head">
        <h2 id="charges-title" className="panel-title">{C.title}</h2>
        <button type="button" className="text-btn text-btn--sm" onClick={onReset}>
          {C.reset}
        </button>
      </div>
      <p className="hint">{c == null ? C.needPrice : C.intro}</p>

      <div className="charge-list">
        <StaticRow label={C.landPrice} amount={money(landPrice)} className="charge-row--base" />

        <EditableRow
          id="govtMarkup"
          label={C.govtMarkup}
          sub={C.govtMarkupSub(settings.govtMarkup || '0')}
          kind="percent"
          prefix="+"
          value={settings.govtMarkup}
          onChange={(v) => onSettingChange('govtMarkup', v)}
          invalid={invalid.has('govtMarkup')}
          amount={money(c?.govtValue)}
          className="charge-row--govt"
          strings={strings}
        />

        {hasBuilding ? (
          <StaticRow label={C.buildingValue} amount={money(buildingValue)} className="charge-row--govt" />
        ) : null}

        {feeRows.map((row) => (
          <EditableRow
            key={row.id}
            id={row.id}
            label={row.label}
            sub={row.sub}
            kind={FIELD_BY_ID[row.id].kind}
            value={settings[row.id]}
            onChange={(v) => onSettingChange(row.id, v)}
            invalid={invalid.has(row.id)}
            amount={money(row.amount)}
            strings={strings}
          />
        ))}

        <StaticRow label={C.totalCharges} amount={money(c?.totalCharges)} className="charge-row--total" />

        <EditableRow
          id="tax"
          label={C.tax}
          sub={taxIsPercent ? C.taxOfTotal : C.taxFixed}
          kind={taxIsPercent ? 'percent' : 'fixed'}
          value={settings.tax}
          onChange={(v) => onSettingChange('tax', v)}
          invalid={invalid.has('tax')}
          amount={money(c?.taxAmount)}
          className="charge-row--tax"
          strings={strings}
          extra={
            <span className="tax-mode" role="group" aria-label={C.taxMode}>
              <button type="button" aria-pressed={taxIsPercent} onClick={() => onSettingChange('taxMode', 'percent')}>
                %
              </button>
              <button type="button" aria-pressed={!taxIsPercent} onClick={() => onSettingChange('taxMode', 'fixed')}>
                ₹
              </button>
            </span>
          }
        />

        <StaticRow label={C.totalWithTax} amount={money(c?.totalWithTax)} className="charge-row--grand" />
      </div>

      <p className="hint charges-note">{C.note}</p>
    </section>
  );
}
