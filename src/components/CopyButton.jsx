import React, { useState } from 'react';

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the textarea fallback */
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <rect x="5" y="5" width="8.5" height="8.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 3.5V3a1.5 1.5 0 0 0-1.5-1.5H3.5A1.5 1.5 0 0 0 2 3v5.5A1.5 1.5 0 0 0 3.5 10H4" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CopyButton({ text, label, strings, notify, className = '' }) {
  const [done, setDone] = useState(false);

  async function handleClick() {
    const ok = await copyText(text);
    if (ok) {
      setDone(true);
      notify?.(`${strings.copied}: ${text}`);
      window.setTimeout(() => setDone(false), 1400);
    } else {
      notify?.(strings.copyFailed);
    }
  }

  return (
    <button
      type="button"
      className={`copy-btn${done ? ' is-done' : ''} ${className}`.trim()}
      onClick={handleClick}
      aria-label={`${strings.copy} ${label}`}
      title={strings.copy}
    >
      {done ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}
