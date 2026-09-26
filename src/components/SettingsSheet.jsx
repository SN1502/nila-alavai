import React, { useEffect, useRef } from 'react';
import { KUZHI_STANDARDS } from '../lib/units.js';

const DECIMAL_OPTIONS = [2, 4, 6];

/**
 * Settings sheet: slides up from the bottom on phones, sits centred on wider
 * screens. Uses the native <dialog> for focus trapping and Esc-to-close.
 */
export default function SettingsSheet({
  open,
  onClose,
  strings,
  lang,
  onLangChange,
  kuzhiStd,
  onKuzhiChange,
  decimals,
  onDecimalsChange,
  theme,
  onThemeChange,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="settings-title"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // A click on the backdrop lands on the dialog element itself.
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="sheet-body">
        <div className="sheet-grip" aria-hidden="true" />
        <div className="sheet-head">
          <h2 id="settings-title" className="panel-title">{strings.settings}</h2>
          <button type="button" className="text-btn" onClick={onClose}>{strings.done}</button>
        </div>

        <div className="field">
          <span className="eyebrow" id="sheet-lang">{strings.language}</span>
          <div className="segmented segmented--full" role="group" aria-labelledby="sheet-lang">
            <button type="button" lang="ta" aria-pressed={lang === 'ta'} onClick={() => onLangChange('ta')}>தமிழ்</button>
            <button type="button" lang="en" aria-pressed={lang === 'en'} onClick={() => onLangChange('en')}>English</button>
          </div>
        </div>

        <div className="field">
          <span className="eyebrow" id="sheet-theme">{strings.theme}</span>
          <div className="segmented segmented--full" role="group" aria-labelledby="sheet-theme">
            {['light', 'dark', 'system'].map((t) => (
              <button key={t} type="button" aria-pressed={theme === t} onClick={() => onThemeChange(t)}>
                {strings.themes[t]}
              </button>
            ))}
          </div>
        </div>

        <fieldset className="field radio-cards">
          <legend className="eyebrow">{strings.kuzhiStandard}</legend>
          <p className="hint">{strings.kuzhiHelp}</p>
          {Object.values(KUZHI_STANDARDS).map((std) => (
            <label key={std.id} className={`radio-card${kuzhiStd === std.id ? ' is-checked' : ''}`}>
              <input
                type="radio"
                name="kuzhi"
                value={std.id}
                checked={kuzhiStd === std.id}
                onChange={() => onKuzhiChange(std.id)}
              />
              <span className="radio-text">
                <span className="radio-title">{lang === 'ta' ? std.ta : std.en}</span>
                <span className="radio-note">{lang === 'ta' ? std.noteTa : std.noteEn}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="field">
          <span className="eyebrow" id="sheet-decimals">{strings.decimals}</span>
          <div className="segmented segmented--full" role="group" aria-labelledby="sheet-decimals">
            {DECIMAL_OPTIONS.map((d) => (
              <button key={d} type="button" aria-pressed={decimals === d} onClick={() => onDecimalsChange(d)}>
                {d}
              </button>
            ))}
          </div>
          <p className="hint">{strings.decimalsHelp}</p>
        </div>
      </div>
    </dialog>
  );
}
