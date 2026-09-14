# Math Lab · מעבדת החשבון

A touch-friendly visual mathematics lab. First activity: equivalent fractions.

## Run

Node.js 24 and npm:

```sh
npm install
npm run dev
```

Open http://localhost:5173/math-lab/.

## Verify

```sh
npx playwright install --with-deps chromium webkit
npm run verify
```

Runs unit tests, strict TypeScript, production build, and browser tests.
Tests cover the full journey, pointer drag/cancel, mobile tap, keyboard, and offline reload.
WebKit emulation does not replace testing drag and PWA installation on real iOS hardware.

CI runs on main and PRs and uploads the built site and test traces.
Bootstrap limitation: generate and commit package-lock.json after verification.
Until then CI uses npm install and uploads the resolved lockfile as an artifact;
once committed, CI automatically uses npm ci.

## Structure and decisions

- src/app: shell and update prompt
- src/activities/equivalent-fractions: local reducer and learning sequence
- src/manipulatives: SVG FractionBar with pointer and keyboard interaction
- src/math: pure fraction validation, exact equality, snapping
- src/styles: tokens and layout
- e2e: production-browser tests

One application, one package. React + strict TypeScript + Vite, CSS Modules,
SVG, local reducers, Vitest, Playwright, vite-plugin-pwa.
No backend, accounts, analytics, global store, generic activity engine, or monorepo.
JSXGraph is an option for future geometry/graphs, not a core dependency.

Fractions preserve numerator/denominator representation. Equality uses exact integer
arithmetic, not pixel widths. Dragging previews and commits on release; cancellation
restores the prior value. Bars run LTR inside the Hebrew RTL shell.
Pointer handling stays in FractionBar until a second use case justifies extraction.

Five guided challenges cover halves, thirds, quarters, and fifths.
Success uses gentle visual feedback. Advancement is explicit, giving the learner time
to notice equivalence. No timed scoring. Reset is always available.

## Offline

Offline use requires one successful online load and service-worker installation.
Updates prompt before reloading and do not interrupt the activity automatically.
Progress is session-only. No CDN, external fonts, or network API during play.
The SVG manifest icon is an initial placeholder: add raster Apple/install icons
before claiming polished cross-device installation.

## Publishing and next steps

The base URL is /math-lab/. The workflow publishes the exact verified dist artifact to
GitHub Pages after successful checks on main. PRs verify but never deploy.
Select GitHub Actions as the Pages source in repository settings.
Site: https://amitzaitman.github.io/math-lab/
Built dist files do not belong in Git.

Next: commit the generated lockfile, test on real iOS, add raster icons.
Then add a splitting-fractions activity and extract only genuinely shared interaction code.
