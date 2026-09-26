# Nila Alavai · நில அளவை

Tamil–English land area converter built with React. Converts between traditional Tamil units, the units used every day in Tamil Nadu, metric units from revenue records, imperial/survey units and neighbouring South Indian units.

## Features

**Built phone-first.** On a 390 × 844 phone the converter fits almost entirely on one screen: a compact indigo input card with one-tap unit chips and a copy button, a 2×2 strip of the usual formats, a one-line sticky bar with the current value and group filters, and all 20 units in a three-column tile grid (tap a tile to convert from it). The plot tab fits on one screen, and the reference tab keeps its explanations collapsed so the unit table comes first. Language, kuzhi size and decimals live in a settings sheet. On wide screens the same parts sit in two columns, tiles gain per-value copy buttons, and tabs move to the top.

- **Converter** – type an extent in any unit and see it in all 20 units at once, with Tamil and English names side by side. Tap any row to convert from that unit; copy any value.
- **Price** – enter a rate (₹ per sq ft, cent, ground, acre or any unit) and get the price of the whole land, in rupees and in lakh/crore words; or enter the total price and get the rate. The same rate is shown per sq ft, cent, ground, acre, sq m and kuzhi. Amounts accept shorthand such as `50k`, `12L`, `1.2cr` or `45 லட்சம்`. The area is shared with the Convert tab, and the Plot tab can send its area straight here.
- **Building** – switch on when the land has a house, well or trees. Building value = built-up area × (construction rate + floor rate) − age depreciation (yearly %, never below a minimum %) + electricity (EB connection + wiring % of the building) + compound wall, sump, borewell and well + trees (count × value per tree for coconut, mango, teak and others). Construction types: RCC, tiled, sheet, thatched; floor types: cement, red oxide, mosaic, tiles, granite, marble. All rates are samples, editable and remembered.
- **Registration cost** – a line-by-line breakdown: government value = land price + 40%; stamp duty 7% and registration fee 2% of the government value plus the building value; computer fee ₹1,500, nala nithi ₹10, video fee ₹100 and online fee ₹1,500; the total registration cost; then tax (a % of that total or a fixed ₹ amount) and the total with tax. Every percentage and fee is editable, remembered and resettable. The price card at the top shows the registration cost with tax.
- **Usual formats** – every result is also written the way people say it: acre – cent, hectare – are (patta format, e.g. `0 – 40.47`), ground – sq ft, and veli – ma – kuzhi.
- **Plot area** – work out the area of a rectangle, a triangle (three sides, Heron's formula) or an irregular four-sided plot (four sides + one diagonal, the way surveyors measure). Lengths in feet, metres, yards or survey links.
- **Reference** – how the calculation works, how the units relate, and the size of every unit in sq ft, sq m and acres.
- **Tamil / English interface**, Indian digit grouping (1,00,000), keyboard-accessible tabs.
- **Light and dark themes** – a sun/moon button in the header, plus Light / Dark / Auto in settings. Auto follows the device.
- **Kuzhi size switch** – 144 sq ft (12 × 12 ft, 100 kuzhi = 1 ma) or 576 sq ft (24 × 24 ft, 100 kuzhi = 1 kani). Ma, kani and veli are the same in both.

## Units

| Group | Units |
| --- | --- |
| Traditional Tamil | குழி Kuzhi, மா Ma (14,400 sq ft), காணி Kani (57,600 sq ft), வேலி Veli (2,88,000 sq ft) |
| Everyday in Tamil Nadu | சதுர அடி Sq ft, சென்ட் Cent (435.6 sq ft), கிரவுண்ட் Ground (2,400 sq ft), ஏக்கர் Acre (43,560 sq ft) |
| Metric | சதுர மீட்டர் Sq m, ஏர் Are (100 sq m), ஹெக்டேர் Hectare (10,000 sq m), சதுர கிலோமீட்டர் Sq km |
| Imperial & survey | Sq inch, Sq yard, Perch (272.25 sq ft), Square chain (4,356 sq ft = 10 cents), Rood (¼ acre), Sq mile (640 acres) |
| Other South Indian | குண்டா Guntha (1,089 sq ft), அங்கணம் Ankanam (72 sq ft) |

Every conversion goes through square feet:

```
result = value × (source unit in sq ft) ÷ (target unit in sq ft)
```

Metric units use the exact international foot (1 ft = 0.3048 m, so 1 sq ft = 0.09290304 sq m).

> Traditional units vary between regions. For registration or purchase decisions, rely on the extent in the patta, chitta and FMB sketch.

## Run it

```bash
npm install
npm run dev        # Vite dev server
npm test           # conversion, geometry, price, building and registration unit tests (node:test, no extra deps)
npm run build      # production build to dist/
```

### Single-file build

`npm run build:single` bundles the app into one HTML file in `dist-single/` that you can open or host anywhere:

```bash
npm run build:single                        # nila-alavai.html, React loaded from CDN
node scripts/build-single.mjs --inline-react   # nila-alavai.offline.html, fully offline
```

## Android app (APK)

`android/` is a small native Android project that shows the app in a full-screen WebView. The whole app is bundled inside the APK (`android/app/src/main/assets/index.html`), so it works offline; internet is only used for the web fonts. Settings, rates and fees are saved on the phone.

**Easiest: build on GitHub (no Android Studio needed)**

1. Push this folder to a GitHub repository.
2. Every push to `main` builds the APK (or run it by hand: **Actions** → **Build Android APK** → **Run workflow**).
3. When it finishes, open the repository's **Releases** page on your phone and tap `nila-alavai.apk`.
4. Open the download and allow "Install unknown apps" for your browser when asked.

**Or build in Android Studio**

1. Open the `android/` folder in Android Studio and let Gradle sync.
2. **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
3. The APK is at `android/app/build/outputs/apk/debug/app-debug.apk`.

**After changing the web app**, refresh the bundled copy before building:

```bash
npm run build:apps
```

The debug APK is signed with Android's debug key, which is fine for installing on your own phones. To publish on Google Play, create a signing key in Android Studio (**Build → Generate Signed App Bundle / APK**).

## Windows desktop app (Windows 7, 8, 10, 11)

`desktop/` wraps the same offline app in Electron **22**, the last Electron release that still runs on Windows 7 SP1, 8 and 8.1 as well as 10 and 11. Two files are built:

- `Nila-Alavai-Setup-<version>.exe` – installer with Start menu and desktop shortcuts; contains both 32-bit and 64-bit builds and picks the right one.
- `Nila-Alavai-Portable-<version>.exe` – 32-bit, runs on any of those Windows versions without installing (USB drive friendly).

They are built on GitHub by the same workflow as the APK and attached to the same release. To build on a Windows PC instead:

```bash
npm run build:apps          # refresh desktop/app/index.html (and the Android copy)
cd desktop
npm install
npm run dist                # output in desktop/release/
```

The files are not code-signed, so SmartScreen may say "Windows protected your PC" the first time; choose **More info → Run anyway**. Electron 22 no longer gets security updates; that is the trade-off for Windows 7/8 support, and the app only shows its own bundled page (web links open in the normal browser).

## Project layout

```
src/
  lib/units.js        unit definitions (sq ft size, Tamil + English names, notes)
  lib/convert.js      conversion, input parsing, Indian number formatting, breakdowns
  lib/geometry.js     rectangle / triangle / four-sides-plus-diagonal areas
  lib/price.js        rupee parsing (12L, 1.2cr), total ↔ rate maths, lakh/crore formatting
  lib/charges.js      government value, stamp duty, registration and fixed fees
  lib/building.js     building value: construction, flooring, depreciation, electricity, extras, trees
  lib/i18n.js         interface text in Tamil and English
  hooks/usePersistentState.js   remembers language, kuzhi size and last input
  components/         Converter, Breakdowns, PriceTab, BuildingPanel, ChargesPanel, PlotArea, Reference, SettingsSheet, CopyButton, Icons
  App.jsx, main.jsx, styles.css
tests/convert.test.js, tests/price.test.js, tests/charges.test.js, tests/building.test.js
scripts/build-single.mjs
android/             Android WebView project (APK)
desktop/             Windows desktop app (Electron 22)
.github/workflows/android-apk.yml   builds the APK and Windows exe files on GitHub and publishes a release
```

To add a unit, append an entry to `STATIC_UNITS` in `src/lib/units.js` with its size in square feet and a `group`; it appears in the converter, the dropdown and the reference table automatically.
