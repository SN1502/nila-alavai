import React from 'react';
import { unitName, unitShortName, unitAbbr } from '../lib/units.js';
import { parseAmount, formatNumber } from '../lib/convert.js';
import {
  parsePrice,
  totalPrice,
  rateFromTotal,
  convertRate,
  formatRupees,
  formatRupeesShort,
  rupeesInWords,
} from '../lib/price.js';
import { UnitSelect } from './Converter.jsx';
import CopyButton from './CopyButton.jsx';
import ChargesPanel from './ChargesPanel.jsx';
import BuildingPanel from './BuildingPanel.jsx';
import { parseChargeSettings, computeCharges } from '../lib/charges.js';
import { computeBuilding } from '../lib/building.js';

// Units people quote land rates in, as one-tap chips.
const RATE_CHIPS = ['sqft', 'cent', 'ground', 'acre'];
// Units shown in the "same rate in other units" grid.
const RATE_GRID = ['sqft', 'cent', 'ground', 'acre', 'sqm', 'kuzhi'];

export default function PriceTab({
  units,
  unitsById,
  lang,
  strings,
  amount,
  onAmountChange,
  fromId,
  onFromChange,
  mode,
  onModeChange,
  rate,
  onRateChange,
  total,
  onTotalChange,
  rateUnitId,
  onRateUnitChange,
  isPriceSample,
  chargeSettings,
  onChargeChange,
  onChargeReset,
  building,
  onBuildingChange,
  onBuildingToggle,
  onBuildingReset,
  notify,
}) {
  const P = strings.price;
  const areaUnit = unitsById[fromId] ?? unitsById.acre;
  const rateUnit = unitsById[rateUnitId] ?? unitsById.sqft;
  const area = parseAmount(amount);
  const money = parsePrice(mode === 'rate' ? rate : total);

  // Work out the headline figure and the rate per the chosen unit.
  let error = null;
  let headline = null; // rupees shown big
  let ratePerUnit = null; // rupees per rateUnit
  let totalRupees = null;
  if (!area.ok) {
    error = strings.errors[area.reason];
  } else if (!money.ok) {
    error = P.errors[money.reason];
  } else if (mode === 'rate') {
    ratePerUnit = money.value;
    totalRupees = totalPrice(money.value, rateUnit, area.value, areaUnit);
    headline = totalRupees;
  } else {
    totalRupees = money.value;
    ratePerUnit = rateFromTotal(money.value, area.value, areaUnit, rateUnit);
    if (ratePerUnit == null) error = P.errors.zeroArea;
    headline = ratePerUnit;
  }

  const words = headline != null ? rupeesInWords(headline, lang) : null;
  const landPrice = headline != null && totalRupees != null ? totalRupees : null;
  const buildingResult = building.enabled ? computeBuilding(building) : null;
  const buildingValue = buildingResult ? buildingResult.total : null;
  // The card shows the registration cost only (stamp + registration + fixed fees), not land + registration.
  const charges =
    landPrice != null ? computeCharges(landPrice, parseChargeSettings(chargeSettings).values, buildingValue ?? 0) : null;
  const registrationCost = charges ? charges.totalWithTax : null;
  const registrationLabel =
    charges && charges.taxAmount > 0
      ? `${strings.charges.withRegistration} (${strings.charges.withTax})`
      : strings.charges.withRegistration;
  const areaText = area.ok ? `${formatNumber(area.value, 4)} ${unitAbbr(areaUnit, lang)}` : '';
  const working =
    headline == null
      ? ''
      : mode === 'rate'
        ? `${areaText} × ${formatRupees(ratePerUnit)} / ${unitAbbr(rateUnit, lang)}`
        : `${formatRupees(totalRupees)} ÷ ${areaText}`;
  const eyebrow = mode === 'rate' ? P.totalPrice : P.ratePer(unitShortName(rateUnit, lang));

  return (
    <div className="price">
      <section className="ink-card price-card" aria-live="polite" aria-labelledby="price-eyebrow">
        <div className="card-top">
          <span className="card-eyebrow" id="price-eyebrow">{eyebrow}</span>
          <span className="card-top-end">
            {isPriceSample && headline != null ? <span className="card-tag">{P.sample}</span> : null}
            {headline != null ? (
              <CopyButton
                className="card-copy"
                text={formatRupees(headline)}
                label={eyebrow}
                strings={strings}
                notify={notify}
              />
            ) : null}
          </span>
        </div>

        {headline == null ? (
          <p className="card-help is-error" role="alert">{error}</p>
        ) : (
          <>
            <p className="price-total">
              <span className="num">{formatRupees(headline)}</span>
            </p>
            <p className="price-words">
              {words ? <strong>{words}</strong> : null}
              <span className="price-working num">{working}</span>
            </p>
            {registrationCost != null ? (
              <p className="price-grand">
                <span>{registrationLabel}</span>
                <span className="num">{formatRupees(registrationCost)}</span>
                {rupeesInWords(registrationCost, lang) ? (
                  <span className="price-grand-words">{rupeesInWords(registrationCost, lang)}</span>
                ) : null}
              </p>
            ) : null}

            <h2 className="sr-only">{P.sameRate}</h2>
            <dl className="card-grid">
              {RATE_GRID.map((id) => {
                const unit = unitsById[id];
                const value = convertRate(ratePerUnit, rateUnit, unit);
                return (
                  <div key={id} className={id === rateUnit.id ? 'is-current' : undefined}>
                    <dt>/ {unitShortName(unit, lang)}</dt>
                    <dd className="num">{formatRupeesShort(value, lang)}</dd>
                  </div>
                );
              })}
            </dl>
          </>
        )}
      </section>

      <section className="panel price-inputs" aria-labelledby="price-title">
        <h2 id="price-title" className="panel-title">{P.title}</h2>

        <div className="segmented segmented--full" role="group" aria-label={P.title}>
          <button type="button" aria-pressed={mode === 'rate'} onClick={() => onModeChange('rate')}>
            {P.modeRate}
          </button>
          <button type="button" aria-pressed={mode === 'total'} onClick={() => onModeChange('total')}>
            {P.modeTotal}
          </button>
        </div>

        {mode === 'rate' ? (
          <div className="field">
            <label htmlFor="price-rate">{P.rateLabel}</label>
            <div className="money-row">
              <div className="money-input">
                <span aria-hidden="true">₹</span>
                <input
                  id="price-rate"
                  inputMode="decimal"
                  autoComplete="off"
                  value={rate}
                  onChange={(e) => onRateChange(e.target.value)}
                  aria-invalid={!money.ok}
                  aria-describedby="price-shorthand"
                />
              </div>
              <span className="money-per" aria-hidden="true">/</span>
              <label htmlFor="rate-unit" className="sr-only">{P.rateUnitLabel}</label>
              <UnitSelect
                id="rate-unit"
                className="plain-select"
                units={units}
                value={rateUnit.id}
                onChange={onRateUnitChange}
                lang={lang}
              />
            </div>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="price-total">{P.totalLabel}</label>
            <div className="money-input">
              <span aria-hidden="true">₹</span>
              <input
                id="price-total"
                inputMode="decimal"
                autoComplete="off"
                value={total}
                onChange={(e) => onTotalChange(e.target.value)}
                aria-invalid={!money.ok}
                aria-describedby="price-shorthand"
              />
            </div>
          </div>
        )}

        <div className="field">
          <span className="eyebrow" id="rate-chips-label">
            {mode === 'rate' ? P.rateUnitLabel : P.showRatePer}
          </span>
          <div className="chips" role="group" aria-labelledby="rate-chips-label">
            {RATE_CHIPS.map((id) => (
              <button key={id} type="button" aria-pressed={rateUnit.id === id} onClick={() => onRateUnitChange(id)}>
                {unitShortName(unitsById[id], lang)}
              </button>
            ))}
          </div>
          <p id="price-shorthand" className="hint">{P.shorthand}</p>
        </div>

        <div className="field">
          <label htmlFor="price-area">{P.landArea}</label>
          <div className="money-row">
            <div className="money-input money-input--plain">
              <input
                id="price-area"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                aria-invalid={!area.ok}
              />
            </div>
            <label htmlFor="price-area-unit" className="sr-only">{unitName(areaUnit, lang)}</label>
            <UnitSelect
              id="price-area-unit"
              className="plain-select"
              units={units}
              value={areaUnit.id}
              onChange={onFromChange}
              lang={lang}
            />
          </div>
          <p className="hint">{P.areaShared}</p>
        </div>
      </section>

      <BuildingPanel
        settings={building}
        result={buildingResult}
        onChange={onBuildingChange}
        onToggle={onBuildingToggle}
        onReset={onBuildingReset}
        lang={lang}
        strings={strings}
        sqftAbbr={unitAbbr(unitsById.sqft, lang)}
      />

      <ChargesPanel
        landPrice={landPrice}
        buildingValue={buildingValue}
        settings={chargeSettings}
        onSettingChange={onChargeChange}
        onReset={onChargeReset}
        lang={lang}
        strings={strings}
      />
    </div>
  );
}
