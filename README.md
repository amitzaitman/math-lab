# Math Lab · מעבדת השברים

A visual cutting and assembly table, built with React, Konva and exact rational arithmetic.

**Play:** https://amitzaitman.github.io/math-lab/

## The experience

The old matching-slider activity has been replaced by five investigations:

1. Cut a whole into two equal halves and fill two half-sized frames.
2. Replace a half with two equal pieces: two quarters cover the same area.
3. Assemble a whole from a half and two quarters.
4. Make thirds: cut off one third, then halve the remaining two thirds.
5. Explore freely: cut, join, and build different representations.

Children can select cut locations including unequal splits, join selected tray pieces,
undo/redo, drag onto frames, or tap a piece and then a destination.
Frames display dots for the requested number of pieces. A correct amount alone does not
complete challenges that require equal parts or a particular partition.
Success keeps the table available for investigation; the child chooses when to continue.

The ruler button changes the reference whole from one unit to half a unit without resizing
any pieces. The eye button reveals notation. Help is optional; the normal table uses
objects, icons, and minimal mathematical symbols. Screen-reader descriptions remain available.

## Stack

- React + TypeScript + Vite
- Konva + react-konva for canvas objects, built-in drag, hit detection and tweens
- Fraction.js for exact arithmetic and comparisons; plain rational strings in state
- Lucide React for tool icons
- CSS Grid/Flexbox for the surrounding controls, not for fake 3D objects
- Vitest + Playwright; vite-plugin-pwa for local offline assets

Shapes have shallow sides and shadows. Their measurable top faces remain undistorted.
No physics engine, free polygon clipping, or independent gesture framework.

## Develop

Node 24 and npm:

```sh
npm ci
npm run dev
```

Open http://localhost:5173/math-lab/.

```sh
npx playwright install --with-deps chromium webkit
npm run verify
```

## Structure

- src/lab/model.ts: exact quantities, reference whole, cuts, joins, placement, history
- src/lab/Table.tsx: Konva presentation, responsive logical coordinates, native drag
- src/lab/Lab.tsx: investigation sequence and accessible DOM controls
- src/lab/model.test.ts: conservation, rejection, equivalence, reference changes, undo/redo
- e2e/fractions.spec.ts: real canvas mouse/touch, keyboard, cancellation, resizing, offline

Model snapshots are JSON-safe and versioned. Display coordinates never decide equality.
One completed drag is one history action. Invalid placements preserve the prior state.
Undo stores at most 60 prior snapshots. The smallest piece is 1/12 of the original unit,
and a scene is capped at 12 pieces to keep interaction manageable on phones.

Progress is currently session-only. A versioned model enables future persistence, but
no claim of cross-session saving is made.

## Validation and publishing

CI runs unit tests, strict type checking, production build and Playwright in Chromium
and mobile WebKit. It publishes the exact tested build from main to GitHub Pages.
PRs verify without publishing. CI captures screenshots and traces as test artifacts.

WebKit's automation offline override blocks cached navigation, so the offline test uses
an isolated server whose connections are cut and verifies an uncached request fails.
Real iOS testing and observation with children remain necessary; automated tests do not
establish teaching effectiveness or real-device install quality.

The PWA caches all activity assets after the first successful online installation.
Updates prompt before reloading; no content CDN, remote fonts or accounts are needed.
The manifest still uses an SVG icon; polished Apple installation icons remain future work.

## Next investigations

Add overlap-based comparisons and a guided prediction before changing the reference whole.
Observe whether children understand unequal splits, conservation and equivalence before
extending to arbitrary shapes, common denominators or more rendering engines.
