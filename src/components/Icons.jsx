import React from 'react';

// Small line icons drawn with currentColor so they follow the theme.
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function ConvertIcon() {
  return (
    <svg {...base}>
      <path d="M4 7h11l-3-3" />
      <path d="M16 13H5l3 3" />
    </svg>
  );
}

export function PriceIcon() {
  return (
    <svg {...base}>
      <path d="M5.5 4h9M5.5 8h9" />
      <path d="M8 4c3.6 0 4.6 1.4 4.6 3.2S11.3 11 8.3 11H6l6.5 5.5" />
    </svg>
  );
}

export function PlotIcon() {
  return (
    <svg {...base}>
      <path d="M3.5 15.5l2-11 11 1.5-1.5 10z" />
      <path d="M3.5 15.5L16.5 6" strokeDasharray="2 2" />
    </svg>
  );
}

export function TableIcon() {
  return (
    <svg {...base}>
      <rect x="3" y="3.5" width="14" height="13" rx="2" />
      <path d="M3 8h14M3 12.3h14M8 8v8.5" />
    </svg>
  );
}

export function SettingsIcon() {
  return (
    <svg {...base}>
      <path d="M3 6h7M14 6h3M3 14h3M10 14h7" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="8" cy="14" r="2" />
    </svg>
  );
}

export function EditIcon() {
  return (
    <svg {...base} width="16" height="16">
      <path d="M12.5 3.5l4 4L8 16H4v-4z" />
    </svg>
  );
}

export function ShapeIcon({ shape }) {
  const props = { ...base, width: 22, height: 22 };
  if (shape === 'rect') {
    return (
      <svg {...props}>
        <rect x="3" y="5" width="14" height="10" rx="1" />
      </svg>
    );
  }
  if (shape === 'triangle') {
    return (
      <svg {...props}>
        <path d="M3 16h14L7 4z" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M3 15l12 1.5L17 4 5 3z" />
      <path d="M3 15L17 4" strokeDasharray="2 2" />
    </svg>
  );
}

export function SunIcon() {
  return (
    <svg {...base}>
      <circle cx="10" cy="10" r="3.4" />
      <path d="M10 2.5v1.8M10 15.7v1.8M2.5 10h1.8M15.7 10h1.8M4.7 4.7l1.3 1.3M14 14l1.3 1.3M4.7 15.3L6 14M14 6l1.3-1.3" />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg {...base}>
      <path d="M16 12.4A6.5 6.5 0 0 1 7.6 4a6.5 6.5 0 1 0 8.4 8.4z" />
    </svg>
  );
}
