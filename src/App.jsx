import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildUnits, unitMap, KUZHI_STANDARDS, DEFAULT_KUZHI } from './lib/units.js';
import { t } from './lib/i18n.js';
import { usePersistentState } from './hooks/usePersistentState.js';
import Converter, { toEditable } from './components/Converter.jsx';
import PlotArea from './components/PlotArea.jsx';
import Reference from './components/Reference.jsx';
import PriceTab from './components/PriceTab.jsx';
import { DEFAULT_CHARGES, isChargeSettings, normalizeChargeSettings } from './lib/charges.js';
import { DEFAULT_BUILDING, isBuildingSettings } from './lib/building.js';

/** Return a copy of obj with a dotted path ("floorRates.tiles") set to value. */
function setPath(obj, path, value) {
  const [head, ...rest] = path.split('.');
  if (rest.length === 0) return { ...obj, [head]: value };
  return { ...obj, [head]: setPath(obj[head] ?? {}, rest.join('.'), value) };
}
import SettingsSheet from './components/SettingsSheet.jsx';
import { ConvertIcon, PriceIcon, PlotIcon, TableIcon, SettingsIcon, SunIcon, MoonIcon } from './components/Icons.jsx';

const TABS = [
  { id: 'convert', Icon: ConvertIcon },
  { id: 'price', Icon: PriceIcon },
  { id: 'plot', Icon: PlotIcon },
  { id: 'reference', Icon: TableIcon },
];
const TAB_IDS = TABS.map((tab) => tab.id);

const isLang = (v) => v === 'ta' || v === 'en';
const isKuzhi = (v) => Object.prototype.hasOwnProperty.call(KUZHI_STANDARDS, v);
const isDecimals = (v) => v === 2 || v === 4 || v === 6;
const isString = (v) => typeof v === 'string';
const isBool = (v) => typeof v === 'boolean';
const isPriceMode = (v) => v === 'rate' || v === 'total';
const isTheme = (v) => v === 'light' || v === 'dark' || v === 'system';

function systemPrefersDark() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

/**
 * Applies the chosen theme as data-theme on <html>. "system" hands control back
 * to the host page / device. If the host re-stamps data-theme while the person
 * has picked light or dark, their choice is put back.
 */
function useTheme(theme) {
  const hostTheme = useRef(
    typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : null,
  );
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      if (theme === 'system') {
        if (hostTheme.current) root.setAttribute('data-theme', hostTheme.current);
        else root.removeAttribute('data-theme');
      } else if (root.getAttribute('data-theme') !== theme) {
        root.setAttribute('data-theme', theme);
      }
    };
    apply();
    const observer = new MutationObserver(() => {
      const current = root.getAttribute('data-theme');
      if (theme === 'system') {
        hostTheme.current = current;
      } else if (current !== theme) {
        hostTheme.current = current;
        root.setAttribute('data-theme', theme);
      }
      setTick((n) => n + 1);
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    let media = null;
    const onMedia = () => setTick((n) => n + 1);
    try {
      media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener?.('change', onMedia);
    } catch {
      /* no media queries */
    }
    return () => {
      observer.disconnect();
      media?.removeEventListener?.('change', onMedia);
    };
  }, [theme]);

  if (theme !== 'system') return theme;
  const attr = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : null;
  void tick;
  return attr === 'dark' || attr === 'light' ? attr : systemPrefersDark() ? 'dark' : 'light';
}

function tabFromHash() {
  try {
    const id = window.location.hash.replace('#', '');
    return TAB_IDS.includes(id) ? id : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [lang, setLang] = usePersistentState('nila.lang', 'ta', isLang);
  const [kuzhiStd, setKuzhiStd] = usePersistentState('nila.kuzhi', DEFAULT_KUZHI, isKuzhi);
  const [decimals, setDecimals] = usePersistentState('nila.decimals', 4, isDecimals);
  const [amount, setAmount] = usePersistentState('nila.amount', '1', isString);
  const [fromId, setFromId] = usePersistentState('nila.from', 'acre', isString);
  const [isSample, setIsSample] = usePersistentState('nila.sample', true, isBool);
  const [priceMode, setPriceMode] = usePersistentState('nila.priceMode', 'rate', isPriceMode);
  const [rate, setRate] = usePersistentState('nila.rate', '1500', isString);
  const [priceTotal, setPriceTotal] = usePersistentState('nila.priceTotal', '45L', isString);
  const [rateUnitId, setRateUnitId] = usePersistentState('nila.rateUnit', 'sqft', isString);
  const [isPriceSample, setIsPriceSample] = usePersistentState('nila.priceSample', true, isBool);
  const [storedCharges, setChargeSettings] = usePersistentState('nila.charges', DEFAULT_CHARGES, isChargeSettings);
  const chargeSettings = normalizeChargeSettings(storedCharges);
  const [theme, setTheme] = usePersistentState('nila.theme', 'system', isTheme);
  const effectiveTheme = useTheme(theme);
  const [building, setBuilding] = usePersistentState('nila.building', DEFAULT_BUILDING, isBuildingSettings);
  const [tab, setTab] = useState(() => tabFromHash() ?? 'convert');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(0);
  const tabRefs = useRef({});

  const strings = t(lang);
  const units = useMemo(() => buildUnits(kuzhiStd), [kuzhiStd]);
  const unitsById = useMemo(() => unitMap(kuzhiStd), [kuzhiStd]);
  const safeFromId = unitsById[fromId] ? fromId : 'acre';
  const safeRateUnitId = unitsById[rateUnitId] ? rateUnitId : 'sqft';

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const onHash = () => {
      const next = tabFromHash();
      if (next) setTab(next);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2200);
  }, []);

  function selectTab(id, focus = false) {
    if (id !== tab) window.scrollTo?.({ top: 0 });
    setTab(id);
    try {
      window.history.replaceState(null, '', `#${id}`);
    } catch {
      /* sandboxed frames may refuse history changes */
    }
    if (focus) tabRefs.current[id]?.focus();
  }

  function onTabKeyDown(e) {
    const i = TAB_IDS.indexOf(tab);
    let next = null;
    if (e.key === 'ArrowRight') next = TAB_IDS[(i + 1) % TAB_IDS.length];
    if (e.key === 'ArrowLeft') next = TAB_IDS[(i - 1 + TAB_IDS.length) % TAB_IDS.length];
    if (e.key === 'Home') next = TAB_IDS[0];
    if (e.key === 'End') next = TAB_IDS[TAB_IDS.length - 1];
    if (next) {
      e.preventDefault();
      selectTab(next, true);
    }
  }

  function handleAmountChange(value, opts = {}) {
    setAmount(value);
    if (!opts.keepSample) setIsSample(false);
  }

  function applyArea(sqft, nextTab) {
    setFromId('sqft');
    setAmount(toEditable(sqft));
    setIsSample(false);
    selectTab(nextTab);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>
            <span className="brand-main">{strings.appName}</span>
            <span className="brand-sub">{strings.appSub}</span>
          </h1>
          <p className="tagline">{strings.tagline}</p>
        </div>

        <div className="top-actions">
          <div className="segmented segmented--sm" role="group" aria-label={strings.language}>
            <button type="button" lang="ta" aria-pressed={lang === 'ta'} onClick={() => setLang('ta')}>
              தமிழ்
            </button>
            <button type="button" lang="en" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
              EN
            </button>
          </div>
          <button
            type="button"
            className="round-btn"
            onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
            aria-label={effectiveTheme === 'dark' ? strings.toLight : strings.toDark}
            title={effectiveTheme === 'dark' ? strings.toLight : strings.toDark}
          >
            {effectiveTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            type="button"
            className="round-btn"
            onClick={() => setSettingsOpen(true)}
            aria-label={strings.settings}
            aria-haspopup="dialog"
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      <nav className="tabbar" role="tablist" aria-label={strings.appName} onKeyDown={onTabKeyDown}>
        {TABS.map(({ id, Icon }) => (
          <button
            key={id}
            id={`tab-${id}`}
            ref={(el) => {
              tabRefs.current[id] = el;
            }}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => selectTab(id)}
          >
            <span className="tab-icon"><Icon /></span>
            <span className="tab-label">{strings.tabs[id]}</span>
          </button>
        ))}
      </nav>

      <main id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'convert' ? (
          <Converter
            units={units}
            unitsById={unitsById}
            lang={lang}
            strings={strings}
            amount={amount}
            onAmountChange={handleAmountChange}
            fromId={safeFromId}
            onFromChange={setFromId}
            decimals={decimals}
            kuzhiStd={kuzhiStd}
            isSample={isSample}
            notify={notify}
          />
        ) : null}
        {tab === 'price' ? (
          <PriceTab
            units={units}
            unitsById={unitsById}
            lang={lang}
            strings={strings}
            amount={amount}
            onAmountChange={handleAmountChange}
            fromId={safeFromId}
            onFromChange={setFromId}
            mode={priceMode}
            onModeChange={setPriceMode}
            rate={rate}
            onRateChange={(v) => {
              setRate(v);
              setIsPriceSample(false);
            }}
            total={priceTotal}
            onTotalChange={(v) => {
              setPriceTotal(v);
              setIsPriceSample(false);
            }}
            rateUnitId={safeRateUnitId}
            onRateUnitChange={setRateUnitId}
            isPriceSample={isPriceSample}
            chargeSettings={chargeSettings}
            onChargeChange={(id, value) => setChargeSettings((prev) => ({ ...normalizeChargeSettings(prev), [id]: value }))}
            onChargeReset={() => {
              setChargeSettings(DEFAULT_CHARGES);
              notify(strings.charges.resetDone);
            }}
            building={building}
            onBuildingChange={(path, value) => setBuilding((prev) => setPath(prev, path, value))}
            onBuildingToggle={(on) => setBuilding((prev) => ({ ...prev, enabled: on }))}
            onBuildingReset={() => {
              setBuilding({ ...DEFAULT_BUILDING, enabled: true });
              notify(strings.building.resetDone);
            }}
            notify={notify}
          />
        ) : null}
        {tab === 'plot' ? (
          <PlotArea
            unitsById={unitsById}
            lang={lang}
            strings={strings}
            kuzhiStd={kuzhiStd}
            onOpenInConverter={(sqft) => applyArea(sqft, 'convert')}
            onOpenInPrice={(sqft) => applyArea(sqft, 'price')}
          />
        ) : null}
        {tab === 'reference' ? (
          <Reference units={units} unitsById={unitsById} lang={lang} strings={strings} kuzhiStd={kuzhiStd} />
        ) : null}
      </main>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        strings={strings}
        lang={lang}
        onLangChange={setLang}
        kuzhiStd={kuzhiStd}
        onKuzhiChange={setKuzhiStd}
        decimals={decimals}
        onDecimalsChange={setDecimals}
        theme={theme}
        onThemeChange={setTheme}
      />

      <div className={`toast${toast ? ' is-visible' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
