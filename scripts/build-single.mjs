// Builds the whole app into ONE self-contained HTML file (no Vite needed at runtime).
//
//   node scripts/build-single.mjs              → dist-single/nila-alavai.html (full document, React from CDN)
//   node scripts/build-single.mjs --fragment   → page body only, for hosts that supply <html>/<head>
//   node scripts/build-single.mjs --inline-react → React bundled in, works fully offline
//
// Uses the classic JSX transform so the bundle can run against the React UMD
// globals (window.React / window.ReactDOM) served from the CDN.

import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const fragment = args.has('--fragment');
const inlineReact = args.has('--inline-react');

const REACT_VERSION = '18.3.1';
const CDN = `https://cdn.jsdelivr.net/npm`;
const FONTS =
  'https://fonts.googleapis.com/css2?family=Catamaran:wght@600;700;800&family=Hind+Madurai:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap';

// Map `import React from 'react'` onto the UMD globals.
const reactGlobals = {
  name: 'react-globals',
  setup(b) {
    b.onResolve({ filter: /^react(-dom)?(\/client)?$/ }, (a) => ({ path: a.path, namespace: 'react-global' }));
    b.onLoad({ filter: /.*/, namespace: 'react-global' }, (a) => ({
      contents: a.path.startsWith('react-dom') ? 'module.exports = window.ReactDOM;' : 'module.exports = window.React;',
      loader: 'js',
    }));
  },
};

const result = await build({
  entryPoints: [path.join(root, 'src/main.jsx')],
  bundle: true,
  write: false,
  minify: true,
  format: 'iife',
  target: ['es2019'],
  outdir: 'out',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  loader: { '.js': 'jsx' },
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: inlineReact ? [] : [reactGlobals],
  legalComments: 'none',
  logLevel: 'warning',
});

const js = result.outputFiles.find((f) => f.path.endsWith('.js')).text.replace(/<\/script/gi, '<\\/script');
const css = result.outputFiles.find((f) => f.path.endsWith('.css')).text.replace(/<\/style/gi, '<\\/style');

const reactScripts = inlineReact
  ? ''
  : [
      `<script src="${CDN}/react@${REACT_VERSION}/umd/react.production.min.js" crossorigin="anonymous"></script>`,
      `<script src="${CDN}/react-dom@${REACT_VERSION}/umd/react-dom.production.min.js" crossorigin="anonymous"></script>`,
    ].join('\n');

const body = `<title>Nila Alavai</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>${css}</style>
<div id="root"></div>
<noscript>Nila Alavai needs JavaScript to convert land units.</noscript>
${reactScripts}
<script>${js}</script>
`;

const html = fragment
  ? body
  : `<!doctype html>
<html lang="ta">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="description" content="Tamil–English land area converter: kuzhi, ma, kani, veli, cent, ground, acre, hectare, are and more.">
</head>
<body>
${body}</body>
</html>
`;

const outDir = path.join(root, 'dist-single');
await mkdir(outDir, { recursive: true });
const name = fragment ? 'nila-alavai.fragment.html' : inlineReact ? 'nila-alavai.offline.html' : 'nila-alavai.html';
await writeFile(path.join(outDir, name), html);
console.log(`Wrote dist-single/${name} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
