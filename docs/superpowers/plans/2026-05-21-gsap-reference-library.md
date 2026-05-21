# GSAP Reference Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure-static-HTML personal library where a designer browses live, looping GSAP animations to find references for projects, with tabbed-by-category navigation and lazy-mounted iframes for performance.

**Architecture:** Single-page static HTML site loaded via `file://` (no build, no server, no Node). Vanilla JS reads a `window.REFERENCES` array (defined in `references.js`) and renders a tabbed grid where each tile lazy-mounts an `<iframe>` pointing to a self-contained `animation.html` for that entry. Tab switching unmounts all iframes; `IntersectionObserver` mounts/unmounts as tiles enter/leave the viewport, keeping concurrent animation count ~6-12 regardless of library size.

**Tech Stack:** Pure HTML/CSS/Vanilla JS. GSAP 3 (via CDN) inside each animation file. No build tools, no Node, no test framework.

---

## Deviations from spec

- **`references.json` → `references.js`** — Same data shape, exposed as `window.REFERENCES = [...]`. Required so the library works from `file://` without a server (Chrome blocks `fetch()` of local JSON files). Spec will be updated post-implementation to reflect this.
- **No formal test framework** — Pure static site can't justify Vitest/Jest. Lightweight `tests.html` page exists for pure JS logic; everything else is manual browser verification.

## Workflow notes

- All work happens on a feature branch `feat/v1-initial-implementation` off main, per CLAUDE.md project rules.
- Commit format: `type: description` (feat/fix/refactor/docs/test). Use single-quoted HEREDOC for multi-line messages so PowerShell doesn't interpret backticks.
- After each task's verification passes, commit before moving on.
- Final merge to main happens at the end of Task 17.

## File structure (final state)

```
gsap-reference-library/
├── index.html                                    # Library UI shell
├── styles.css                                    # All UI styling
├── library.js                                    # Tab rendering, grid, lazy-mount, search
├── references.js                                 # window.REFERENCES = [...]
├── tests.html                                    # Test runner page (open in browser to run)
├── tests.js                                      # Assertions for library.js pure functions
├── references/
│   ├── 001-card-tilt-hover/animation.html        # Card 3D tilt, self-demoed
│   ├── 002-text-line-reveal/animation.html       # Staggered line reveal, looping
│   ├── 003-magnetic-button/animation.html        # Button follows simulated cursor
│   ├── 004-gradient-breathing/animation.html     # Ambient gradient cycle
│   └── 005-hero-text-cascade/animation.html      # Hero title letter cascade
├── CLAUDE.md                                     # Future-Claude project rules
├── README.md                                     # Designer-facing usage guide
├── .gitignore                                    # (already exists from spec commit)
└── docs/superpowers/specs/...                    # (already exists from spec commit)
```

---

## Task 1: Create feature branch and scaffold root files

**Files:**
- Modify (branch): repository state
- Create: `references.js`
- Create: `index.html`
- Create: `styles.css`
- Create: `library.js`

This task gets the empty skeleton in place so subsequent tasks can iterate.

- [ ] **Step 1: Create feature branch**

```bash
cd /c/ClaudeProjects/gsap-reference-library
git checkout -b feat/v1-initial-implementation
```

Verify: `git branch --show-current` outputs `feat/v1-initial-implementation`.

- [ ] **Step 2: Create `references.js` with empty array**

Path: `references.js`

```js
// Master metadata list for all references in the library.
// Each entry corresponds to a folder under references/<id>/ containing animation.html.
//
// Field rules:
//   id        — kebab-case, prefixed with 3-digit sequence (e.g. "001-card-tilt-hover").
//               MUST match the folder name under references/.
//   name      — human-readable label shown under the tile.
//   category  — one of: "Hero" | "Nav" | "Cards" | "Buttons" | "Text" | "Images" |
//               "Background" | "Page transitions"
//   size      — "1x1" | "2x2" | "fullrow"
//   source    — URL of the original animation (required; ask designer if missing).
//   added     — ISO date the entry was added.
//   notes     — optional free text.
window.REFERENCES = [];
```

- [ ] **Step 3: Create `index.html` shell**

Path: `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GSAP Reference Library</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <div class="title-strip">
      <div>
        <h1>GSAP Reference Library</h1>
        <p class="subtitle" id="entry-count">0 references</p>
      </div>
      <input type="search" id="search" placeholder="Search..." autocomplete="off">
    </div>
    <nav id="tab-bar" class="tab-bar"></nav>
  </header>
  <main>
    <div id="grid" class="grid"></div>
  </main>
  <script src="references.js"></script>
  <script src="library.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create `styles.css`**

Path: `styles.css`

```css
:root {
  --bg: #fafafa;
  --surface: #ffffff;
  --text: #111111;
  --text-secondary: #888888;
  --text-tertiary: #aaaaaa;
  --border: #eeeeee;
  --accent: #111111;
  --radius: 12px;
  --tile-gap: 20px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Header */
header { background: var(--surface); border-bottom: 1px solid var(--border); }

.title-strip {
  padding: 28px 32px 8px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 1px solid var(--border);
  gap: 24px;
}

.title-strip h1 { font-size: 22px; font-weight: 600; margin: 0; }
.title-strip .subtitle { font-size: 13px; color: var(--text-secondary); margin: 4px 0 0; }

#search {
  width: 220px;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  font-family: inherit;
}
#search:focus { outline: 2px solid var(--accent); outline-offset: -1px; }

/* Tab bar */
.tab-bar { display: flex; padding: 0 32px; }
.tab {
  padding: 14px 18px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  user-select: none;
}
.tab:hover { color: var(--text); }
.tab.active { color: var(--text); font-weight: 600; border-bottom-color: var(--accent); }
.tab-count { color: var(--text-tertiary); font-weight: 400; margin-left: 4px; }

/* Grid */
.grid {
  padding: 28px 32px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--tile-gap);
}

.tile { display: flex; flex-direction: column; }

.tile.size-1x1 .tile-frame-container { aspect-ratio: 1 / 1; }

.tile.size-2x2 { grid-column: span 2; grid-row: span 2; }
.tile.size-2x2 .tile-frame-container { aspect-ratio: 1 / 1; }

.tile.size-fullrow { grid-column: 1 / -1; }
.tile.size-fullrow .tile-frame-container { aspect-ratio: 3.2 / 1; }

.tile-frame-container {
  background: #f0f0f0;
  border-radius: var(--radius);
  overflow: hidden;
  position: relative;
}
.tile-frame-container iframe { width: 100%; height: 100%; border: 0; display: block; }

.tile-meta {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tile-name { font-size: 14px; color: var(--text); }
.tile-source { font-size: 12px; color: var(--text-tertiary); text-decoration: none; }
.tile-source:hover { color: var(--text); }

/* Empty state */
.empty-state {
  grid-column: 1 / -1;
  padding: 80px 0;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}
```

- [ ] **Step 5: Create `library.js` stub**

Path: `library.js`

```js
// GSAP Reference Library — main UI logic.
// This file is filled in progressively in Tasks 2-7.
console.log("library.js loaded. References:", (window.REFERENCES || []).length);
```

- [ ] **Step 6: Verify in browser**

Open `index.html` by double-clicking it (or `file:///C:/ClaudeProjects/gsap-reference-library/index.html`).

Expected:
- Title "GSAP Reference Library" visible
- Subtitle "0 references"
- Empty search box on the right
- Empty tab bar
- Empty grid below
- DevTools console shows `library.js loaded. References: 0`
- No errors in console

- [ ] **Step 7: Commit**

```bash
git add references.js index.html styles.css library.js
git commit -m "feat: scaffold static HTML shell with empty UI

Initial scaffold of index.html, styles.css, references.js, and library.js
stub. Page loads with header, empty tab bar, and empty grid container.
References data exposed via window.REFERENCES (not fetch'd JSON) so the
library works from file:// without a server.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Render the tab bar from references

**Files:**
- Modify: `library.js` (replace entire stub)
- Create: `references.js` is modified to seed test data temporarily (will be replaced by real seeds in Tasks 12-16). Actually we'll add temporary entries to test the tabs, then keep them and overwrite in later tasks.

This task adds tab rendering. To see anything, we temporarily add a few placeholder entries to `references.js` so tabs have counts > 0.

- [ ] **Step 1: Add temporary seed entries to `references.js`**

Path: `references.js` — replace the empty array with:

```js
window.REFERENCES = [
  { id: "001-card-tilt-hover", name: "Card tilt hover", category: "Cards", size: "1x1", source: "https://example.com", added: "2026-05-21" },
  { id: "002-text-line-reveal", name: "Text line reveal", category: "Text", size: "1x1", source: "https://example.com", added: "2026-05-21" },
  { id: "003-magnetic-button", name: "Magnetic button", category: "Buttons", size: "1x1", source: "https://example.com", added: "2026-05-21" },
  { id: "004-gradient-breathing", name: "Gradient breathing", category: "Background", size: "fullrow", source: "https://example.com", added: "2026-05-21" },
  { id: "005-hero-text-cascade", name: "Hero text cascade", category: "Hero", size: "2x2", source: "https://example.com", added: "2026-05-21" },
];
```

These entries don't have animation files yet — that's fine for this task; we're only testing tab rendering.

- [ ] **Step 2: Replace `library.js` with tab-rendering implementation**

Path: `library.js` — replace entire file:

```js
const CATEGORIES = [
  "Hero", "Nav", "Cards", "Buttons", "Text", "Images", "Background", "Page transitions"
];

const REFERENCES = window.REFERENCES || [];

let activeCategory = null;

function renderTabs() {
  const tabBar = document.getElementById("tab-bar");
  tabBar.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const count = REFERENCES.filter(r => r.category === cat).length;
    const tab = document.createElement("div");
    tab.className = "tab";
    tab.dataset.category = cat;
    tab.innerHTML = `${cat} <span class="tab-count">${count}</span>`;
    tab.addEventListener("click", () => setActiveCategory(cat));
    tabBar.appendChild(tab);
  });
}

function setActiveCategory(category) {
  activeCategory = category;
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.toggle("active", t.dataset.category === category);
  });
}

function renderEntryCount() {
  document.getElementById("entry-count").textContent =
    `${REFERENCES.length} reference${REFERENCES.length === 1 ? "" : "s"}`;
}

function init() {
  renderEntryCount();
  renderTabs();
  // Default to first category that has entries; fall back to first category.
  const firstWithEntries = CATEGORIES.find(c => REFERENCES.some(r => r.category === c));
  setActiveCategory(firstWithEntries || CATEGORIES[0]);
}

document.addEventListener("DOMContentLoaded", init);
```

- [ ] **Step 3: Verify in browser**

Reload `index.html`.

Expected:
- Subtitle now reads `5 references`
- Tab bar shows 8 tabs: `Hero (1)`, `Nav (0)`, `Cards (1)`, `Buttons (1)`, `Text (1)`, `Images (0)`, `Background (1)`, `Page transitions (0)`
- The "Hero" tab is underlined (active by default since it's first with entries)
- Clicking other tabs moves the underline; previously-active tab returns to muted
- No console errors

- [ ] **Step 4: Commit**

```bash
git add references.js library.js
git commit -m "feat: render tab bar with per-category counts

Tabs are clickable and active state moves between them. Five placeholder
references added (one per category we want to populate). Grid still
empty in this task.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Render grid tiles for active tab (without iframes)

**Files:**
- Modify: `library.js`

In this task tiles are visible as colored rectangles with names + source links, but no iframes are mounted yet. This lets us verify grid layout (1x1, 2x2, fullrow) before adding the complexity of iframe lifecycle.

- [ ] **Step 1: Add grid-rendering functions to `library.js`**

Path: `library.js` — append the following functions BEFORE `init()`:

```js
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function createTile(entry) {
  const tile = document.createElement("div");
  tile.className = `tile size-${entry.size}`;
  tile.dataset.id = entry.id;
  tile.dataset.path = `references/${entry.id}/animation.html`;

  const frameContainer = document.createElement("div");
  frameContainer.className = "tile-frame-container";
  // Placeholder background so we can see tile shape without iframe.
  frameContainer.style.background = "linear-gradient(135deg, #ececec, #d8d8d8)";

  const meta = document.createElement("div");
  meta.className = "tile-meta";
  meta.innerHTML = `
    <span class="tile-name">${escapeHTML(entry.name)}</span>
    <a class="tile-source" href="${escapeHTML(entry.source)}" target="_blank" rel="noopener">↗</a>
  `;

  tile.appendChild(frameContainer);
  tile.appendChild(meta);
  return tile;
}

function renderGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  const entries = REFERENCES.filter(r => r.category === activeCategory);

  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = `No references in "${activeCategory}" yet. Tell Claude to add one.`;
    grid.appendChild(empty);
    return;
  }

  entries.forEach(entry => grid.appendChild(createTile(entry)));
}
```

- [ ] **Step 2: Modify `setActiveCategory` to call `renderGrid`**

Find this function in `library.js`:

```js
function setActiveCategory(category) {
  activeCategory = category;
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.toggle("active", t.dataset.category === category);
  });
}
```

Replace with:

```js
function setActiveCategory(category) {
  activeCategory = category;
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.toggle("active", t.dataset.category === category);
  });
  renderGrid();
}
```

- [ ] **Step 3: Verify in browser — 1×1 tile**

Reload. The "Hero" tab is active by default. Click "Cards" tab.

Expected:
- One square (1×1) tile appears in the grid with placeholder gradient background
- Caption "Card tilt hover" with ↗ link
- Clicking ↗ opens `https://example.com` in new tab

- [ ] **Step 4: Verify 2×2 tile**

Click "Hero" tab.

Expected:
- One 2×2 tile (spans 2 columns wide × 2 rows tall) with placeholder gradient
- Caption "Hero text cascade"

- [ ] **Step 5: Verify fullrow tile**

Click "Background" tab.

Expected:
- One tile spanning the full grid width (all 3 columns) with wider aspect ratio
- Caption "Gradient breathing"

- [ ] **Step 6: Verify empty state**

Click "Nav" tab.

Expected:
- No tiles. Centered message: `No references in "Nav" yet. Tell Claude to add one.`

- [ ] **Step 7: Commit**

```bash
git add library.js
git commit -m "feat: render grid tiles with size variants and empty state

Tiles render with correct grid spans for 1x1, 2x2, and fullrow sizes.
Caption shows name + source link. Empty tabs show a 'no references yet'
message. Tiles use placeholder gradient backgrounds; iframes added in
the next task.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Create placeholder animation.html files and mount iframes (no lazy-load yet)

**Files:**
- Create: `references/001-card-tilt-hover/animation.html`
- Create: `references/002-text-line-reveal/animation.html`
- Create: `references/003-magnetic-button/animation.html`
- Create: `references/004-gradient-breathing/animation.html`
- Create: `references/005-hero-text-cascade/animation.html`
- Modify: `library.js`

Each placeholder is a minimal HTML file that shows the entry's name centered on a colored background. Real animations replace these in Tasks 11-15.

- [ ] **Step 1: Create placeholder `references/001-card-tilt-hover/animation.html`**

Path: `references/001-card-tilt-hover/animation.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Card tilt hover (placeholder)</title>
<style>
  html, body { margin:0; height:100%; display:flex; align-items:center; justify-content:center;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    background:#f4f1ee; color:#444; font-size:14px;
  }
</style>
</head>
<body>placeholder · 001-card-tilt-hover</body>
</html>
```

- [ ] **Step 2: Create placeholder `references/002-text-line-reveal/animation.html`**

Path: `references/002-text-line-reveal/animation.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Text line reveal (placeholder)</title>
<style>
  html, body { margin:0; height:100%; display:flex; align-items:center; justify-content:center;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    background:#fff5e6; color:#444; font-size:14px;
  }
</style>
</head>
<body>placeholder · 002-text-line-reveal</body>
</html>
```

- [ ] **Step 3: Create placeholder `references/003-magnetic-button/animation.html`**

Path: `references/003-magnetic-button/animation.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Magnetic button (placeholder)</title>
<style>
  html, body { margin:0; height:100%; display:flex; align-items:center; justify-content:center;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    background:#e8f0ff; color:#444; font-size:14px;
  }
</style>
</head>
<body>placeholder · 003-magnetic-button</body>
</html>
```

- [ ] **Step 4: Create placeholder `references/004-gradient-breathing/animation.html`**

Path: `references/004-gradient-breathing/animation.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Gradient breathing (placeholder)</title>
<style>
  html, body { margin:0; height:100%; display:flex; align-items:center; justify-content:center;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    background:#f7f1ff; color:#444; font-size:14px;
  }
</style>
</head>
<body>placeholder · 004-gradient-breathing</body>
</html>
```

- [ ] **Step 5: Create placeholder `references/005-hero-text-cascade/animation.html`**

Path: `references/005-hero-text-cascade/animation.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Hero text cascade (placeholder)</title>
<style>
  html, body { margin:0; height:100%; display:flex; align-items:center; justify-content:center;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    background:#111; color:#eee; font-size:14px;
  }
</style>
</head>
<body>placeholder · 005-hero-text-cascade</body>
</html>
```

- [ ] **Step 6: Mount iframes in `createTile`**

Find this in `library.js`:

```js
  const frameContainer = document.createElement("div");
  frameContainer.className = "tile-frame-container";
  // Placeholder background so we can see tile shape without iframe.
  frameContainer.style.background = "linear-gradient(135deg, #ececec, #d8d8d8)";
```

Replace with:

```js
  const frameContainer = document.createElement("div");
  frameContainer.className = "tile-frame-container";
  const iframe = document.createElement("iframe");
  iframe.src = tile.dataset.path;
  iframe.setAttribute("loading", "lazy");
  iframe.setAttribute("sandbox", "allow-scripts");
  frameContainer.appendChild(iframe);
```

- [ ] **Step 7: Verify in browser**

Reload `index.html`. Click each tab that has an entry.

Expected:
- Each tile now shows an iframe containing the placeholder content (e.g., "placeholder · 001-card-tilt-hover" centered on the entry's background color)
- Cards tab shows the tan placeholder
- Hero tab shows the dark placeholder (2×2)
- Background tab shows the lavender placeholder (fullrow)
- No iframe loading errors in DevTools console
- DevTools Elements panel shows `<iframe src="references/001-card-tilt-hover/animation.html">` etc.

- [ ] **Step 8: Commit**

```bash
git add references/ library.js
git commit -m "feat: mount placeholder iframes in tiles

Five placeholder animation.html files created (one per seed reference).
createTile() now embeds an iframe pointing at the entry's animation.html.
All iframes mount eagerly here; lazy-mount added in the next task.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Lazy-mount iframes via IntersectionObserver

**Files:**
- Modify: `library.js`

Switch from eager mounting (every tile gets an iframe immediately) to lazy: only mount when the tile enters (or is within 200px of) the viewport, unmount when it leaves. This is the perf safeguard for 50+ entries.

- [ ] **Step 1: Refactor `createTile` to skip eager iframe**

Find this in `library.js`:

```js
  const frameContainer = document.createElement("div");
  frameContainer.className = "tile-frame-container";
  const iframe = document.createElement("iframe");
  iframe.src = tile.dataset.path;
  iframe.setAttribute("loading", "lazy");
  iframe.setAttribute("sandbox", "allow-scripts");
  frameContainer.appendChild(iframe);
```

Replace with:

```js
  const frameContainer = document.createElement("div");
  frameContainer.className = "tile-frame-container";
  // iframe is mounted/unmounted by the IntersectionObserver in setupLazyMount().
```

- [ ] **Step 2: Add lazy-mount helpers and observer setup**

Add the following functions to `library.js`, just above the `init()` function:

```js
let intersectionObserver = null;

function mountIframe(tile) {
  const container = tile.querySelector(".tile-frame-container");
  if (!container || container.querySelector("iframe")) return;
  const iframe = document.createElement("iframe");
  iframe.src = tile.dataset.path;
  iframe.setAttribute("sandbox", "allow-scripts");
  container.appendChild(iframe);
}

function unmountIframe(tile) {
  const container = tile.querySelector(".tile-frame-container");
  if (!container) return;
  const iframe = container.querySelector("iframe");
  if (iframe) iframe.remove();
}

function unmountAllIframes() {
  document.querySelectorAll(".tile").forEach(unmountIframe);
}

function setupLazyMount() {
  if (intersectionObserver) intersectionObserver.disconnect();
  intersectionObserver = new IntersectionObserver(records => {
    records.forEach(rec => {
      if (rec.isIntersecting) {
        mountIframe(rec.target);
      } else {
        unmountIframe(rec.target);
      }
    });
  }, { rootMargin: "200px" });
  document.querySelectorAll(".tile").forEach(t => intersectionObserver.observe(t));
}
```

- [ ] **Step 3: Wire `setupLazyMount` into `renderGrid`**

Find this in `library.js`:

```js
  entries.forEach(entry => grid.appendChild(createTile(entry)));
}
```

Replace with:

```js
  entries.forEach(entry => grid.appendChild(createTile(entry)));
  setupLazyMount();
}
```

- [ ] **Step 4: Verify in browser — mount on scroll-in**

Reload `index.html`. Open DevTools → Elements panel. Click "Cards" tab.

Expected:
- The Cards tile is visible in viewport on load → its `<iframe>` is present in the DOM
- Console has no errors
- Tile shows placeholder content like before

- [ ] **Step 5: Verify unmount on scroll-out (manual)**

In `library.js`, temporarily seed many entries to test scrolling. Add this LINE to the top of `references.js` (after the existing `window.REFERENCES = [...]` array):

```js
// TEMPORARY: pad with duplicates for scroll testing
for (let i = 6; i <= 30; i++) {
  window.REFERENCES.push({
    id: `001-card-tilt-hover`,  // reuse existing animation.html
    name: `Card test #${i}`,
    category: "Cards",
    size: "1x1",
    source: "https://example.com",
    added: "2026-05-21",
  });
}
```

Reload. Click "Cards" tab. Now there are 26 tiles.

Expected:
- Open DevTools Elements panel. Watch the `.tile-frame-container` elements for tiles below the fold.
- Tiles within ~200px of viewport contain `<iframe>` children.
- Tiles far below the fold show only an empty `<div class="tile-frame-container">` — no iframe.
- Scroll down. As tiles enter the viewport, iframes appear inside them. As they scroll out (top), iframes are removed.

- [ ] **Step 6: Remove the test padding**

Remove the temporary for-loop from `references.js`. Save.

- [ ] **Step 7: Verify cleanup**

Reload `index.html`. Confirm subtitle now reads `5 references` again.

- [ ] **Step 8: Commit**

```bash
git add library.js references.js
git commit -m "perf: lazy-mount iframes via IntersectionObserver

Iframes are no longer eagerly inserted. They mount when a tile is within
200px of the viewport and unmount when they leave. This caps concurrent
animation count regardless of total library size.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Unmount iframes when switching tabs

**Files:**
- Modify: `library.js`

When the user clicks a different tab, the old tab's iframes should be unmounted before the new tab's tiles render. Currently `renderGrid` calls `innerHTML = ""` on the grid which removes elements but doesn't necessarily release iframe resources cleanly. Add an explicit unmount step before re-rendering.

- [ ] **Step 1: Disconnect observer and unmount before re-render**

Find this in `library.js`:

```js
function renderGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  const entries = REFERENCES.filter(r => r.category === activeCategory);
```

Replace with:

```js
function renderGrid() {
  // Tear down current tab's iframes and observer before re-rendering.
  if (intersectionObserver) intersectionObserver.disconnect();
  unmountAllIframes();

  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  const entries = REFERENCES.filter(r => r.category === activeCategory);
```

- [ ] **Step 2: Verify in browser**

Reload `index.html`. Open DevTools → Elements panel. Click "Cards" tab → iframe mounts. Click "Hero" tab → Cards tile is gone, Hero tile (2×2) is shown with its iframe.

Expected:
- Switching tabs is smooth (no flash, no stuck content)
- DevTools Elements shows only the current tab's tiles, with iframes mounted appropriately
- Click "Nav" (empty) → empty state message replaces the grid; no orphan tiles
- No console errors

- [ ] **Step 3: Commit**

```bash
git add library.js
git commit -m "fix: explicitly tear down observer and iframes on tab switch

Tab transitions now disconnect the IntersectionObserver and unmount all
iframes before re-rendering the new category. Prevents potential
animation/resource leaks between tab views.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Implement search

**Files:**
- Modify: `library.js`

Search filters across all categories. When the search box has content, the grid shows matching entries from any category. When cleared, the grid returns to showing the active tab's entries.

- [ ] **Step 1: Add search state and handlers**

Add this function to `library.js` just above `init()`:

```js
function setupSearch() {
  const input = document.getElementById("search");
  input.addEventListener("input", e => {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      renderGrid();
      return;
    }
    renderSearchResults(query);
  });
}

function matchesQuery(entry, query) {
  if (entry.name.toLowerCase().includes(query)) return true;
  if (entry.notes && entry.notes.toLowerCase().includes(query)) return true;
  if (entry.category.toLowerCase().includes(query)) return true;
  return false;
}

function renderSearchResults(query) {
  if (intersectionObserver) intersectionObserver.disconnect();
  unmountAllIframes();

  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  const matches = REFERENCES.filter(r => matchesQuery(r, query));

  if (matches.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = `No matches for "${query}".`;
    grid.appendChild(empty);
    return;
  }

  matches.forEach(entry => grid.appendChild(createTile(entry)));
  setupLazyMount();
}
```

- [ ] **Step 2: Wire `setupSearch` into `init`**

Find this in `library.js`:

```js
function init() {
  renderEntryCount();
  renderTabs();
  // Default to first category that has entries; fall back to first category.
  const firstWithEntries = CATEGORIES.find(c => REFERENCES.some(r => r.category === c));
  setActiveCategory(firstWithEntries || CATEGORIES[0]);
}
```

Replace with:

```js
function init() {
  renderEntryCount();
  renderTabs();
  setupSearch();
  // Default to first category that has entries; fall back to first category.
  const firstWithEntries = CATEGORIES.find(c => REFERENCES.some(r => r.category === c));
  setActiveCategory(firstWithEntries || CATEGORIES[0]);
}
```

- [ ] **Step 3: Verify search**

Reload `index.html`. Click in the search box.

Type `card`:
- Expected: Only "Card tilt hover" tile shown (any category, but filtered to that one matching entry)

Type `xyz`:
- Expected: Empty-state message `No matches for "xyz".`

Clear the search input:
- Expected: Grid returns to the active tab's view

- [ ] **Step 4: Commit**

```bash
git add library.js
git commit -m "feat: add search filtering across all categories

Typing in the search box filters all entries by name, notes, and
category. Clearing the input returns to the active tab's grid. No
matches shows an explicit empty state.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Add test runner page for pure JS logic

**Files:**
- Create: `tests.html`
- Create: `tests.js`
- Modify: `library.js` (extract pure functions and expose them)

Pure functions (`matchesQuery`, the category-counter logic) can be tested deterministically. A `tests.html` page runs assertions and displays pass/fail directly in the browser.

- [ ] **Step 1: Expose `matchesQuery` and add a helper for testability**

Find this in `library.js`:

```js
function matchesQuery(entry, query) {
  if (entry.name.toLowerCase().includes(query)) return true;
  if (entry.notes && entry.notes.toLowerCase().includes(query)) return true;
  if (entry.category.toLowerCase().includes(query)) return true;
  return false;
}
```

Add this BELOW it:

```js
function countByCategory(references, category) {
  return references.filter(r => r.category === category).length;
}

// Expose for tests.html
window.__libraryInternals = { matchesQuery, countByCategory };
```

- [ ] **Step 2: Create `tests.html`**

Path: `tests.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Library Tests</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 24px; background: #fafafa; color: #111; }
    h1 { font-size: 18px; margin-top: 0; }
    .test { padding: 6px 10px; border-radius: 6px; margin: 4px 0; font-size: 13px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .pass { background: #e6f6e6; color: #1a6b1a; }
    .fail { background: #fde6e6; color: #a01515; }
    .summary { margin-top: 16px; font-size: 14px; }
  </style>
</head>
<body>
  <h1>library.js unit tests</h1>
  <div id="results"></div>
  <div id="summary" class="summary"></div>

  <!-- Empty REFERENCES — tests don't need the real seed data -->
  <script>window.REFERENCES = [];</script>
  <script src="library.js"></script>
  <script src="tests.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create `tests.js`**

Path: `tests.js`

```js
(function runTests() {
  const { matchesQuery, countByCategory } = window.__libraryInternals;
  const results = document.getElementById("results");
  const summary = document.getElementById("summary");

  let passed = 0, failed = 0;

  function test(name, fn) {
    try {
      const result = fn();
      if (result === true) {
        results.innerHTML += `<div class="test pass">✓ ${name}</div>`;
        passed++;
      } else {
        results.innerHTML += `<div class="test fail">✗ ${name} — returned ${JSON.stringify(result)}</div>`;
        failed++;
      }
    } catch (e) {
      results.innerHTML += `<div class="test fail">✗ ${name} — threw: ${e.message}</div>`;
      failed++;
    }
  }

  // ---- matchesQuery ----
  const sample = { id: "001", name: "Card tilt hover", category: "Cards", size: "1x1",
                   source: "x", added: "2026-05-21", notes: "Subtle 3D feel" };

  test("matchesQuery: matches on name (lowercase)", () =>
    matchesQuery(sample, "card") === true);

  test("matchesQuery: case-insensitive name match", () =>
    matchesQuery(sample, "TILT") === true);

  test("matchesQuery: matches on notes substring", () =>
    matchesQuery(sample, "subtle") === true);

  test("matchesQuery: matches on category", () =>
    matchesQuery(sample, "cards") === true);

  test("matchesQuery: returns false when nothing matches", () =>
    matchesQuery(sample, "nonsense") === false);

  test("matchesQuery: handles missing notes field", () => {
    const noNotes = { ...sample, notes: undefined };
    return matchesQuery(noNotes, "card") === true;
  });

  // ---- countByCategory ----
  const refs = [
    { category: "Cards" }, { category: "Cards" }, { category: "Hero" }
  ];

  test("countByCategory: returns 2 for Cards", () =>
    countByCategory(refs, "Cards") === 2);

  test("countByCategory: returns 1 for Hero", () =>
    countByCategory(refs, "Hero") === 1);

  test("countByCategory: returns 0 for unmatched category", () =>
    countByCategory(refs, "Nav") === 0);

  test("countByCategory: returns 0 for empty references", () =>
    countByCategory([], "Cards") === 0);

  // ---- Summary ----
  summary.textContent = `${passed} passed, ${failed} failed (${passed + failed} total)`;
  summary.style.color = failed === 0 ? "#1a6b1a" : "#a01515";
})();
```

- [ ] **Step 4: Verify tests pass**

Open `tests.html` in browser.

Expected:
- 10 green "✓" rows
- Summary at the bottom: `10 passed, 0 failed (10 total)` in green
- No console errors

- [ ] **Step 5: Verify a test failure surfaces correctly**

Temporarily break the test: change `matchesQuery(sample, "card") === true` to `=== false` (a wrong assertion). Reload `tests.html`.

Expected:
- One red "✗" row, summary in red
- Revert the change. Reload. Back to all green.

- [ ] **Step 6: Commit**

```bash
git add tests.html tests.js library.js
git commit -m "test: add browser-based test runner for library.js pure functions

tests.html loads library.js with an empty REFERENCES array and runs
assertions against matchesQuery and countByCategory. Open in browser
to run; results display inline with pass/fail summary.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Wire up entry count + first polish pass

**Files:**
- Modify: `library.js`

Currently the entry count is set once at init. Add a small polish item: make the count reflect search state ("3 matches" when searching, "62 references" otherwise).

- [ ] **Step 1: Update `renderEntryCount` to accept an optional override**

Find this in `library.js`:

```js
function renderEntryCount() {
  document.getElementById("entry-count").textContent =
    `${REFERENCES.length} reference${REFERENCES.length === 1 ? "" : "s"}`;
}
```

Replace with:

```js
function renderEntryCount(override) {
  const el = document.getElementById("entry-count");
  if (override !== undefined) {
    el.textContent = override;
    return;
  }
  el.textContent = `${REFERENCES.length} reference${REFERENCES.length === 1 ? "" : "s"}`;
}
```

- [ ] **Step 2: Call `renderEntryCount` from search and tab handlers**

Find this in `renderSearchResults`:

```js
  if (matches.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = `No matches for "${query}".`;
    grid.appendChild(empty);
    return;
  }
```

Add this line ABOVE that `if`:

```js
  renderEntryCount(`${matches.length} match${matches.length === 1 ? "" : "es"} for "${query}"`);
```

So the block becomes:

```js
  renderEntryCount(`${matches.length} match${matches.length === 1 ? "" : "es"} for "${query}"`);

  if (matches.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = `No matches for "${query}".`;
    grid.appendChild(empty);
    return;
  }
```

Then find the search input handler in `setupSearch`:

```js
  input.addEventListener("input", e => {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      renderGrid();
      return;
    }
    renderSearchResults(query);
  });
```

Replace with:

```js
  input.addEventListener("input", e => {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      renderEntryCount();  // restore default
      renderGrid();
      return;
    }
    renderSearchResults(query);
  });
```

- [ ] **Step 3: Verify**

Reload `index.html`.

Expected:
- Default state: subtitle reads `5 references`
- Type `card` in search: subtitle reads `1 match for "card"`
- Type `xyz`: subtitle reads `0 matches for "xyz"`
- Clear search: subtitle returns to `5 references`

- [ ] **Step 4: Commit**

```bash
git add library.js
git commit -m "feat: reflect search match count in header subtitle

The 'N references' label updates to 'N matches for X' while a search is
active and returns to the total count when cleared.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Mid-implementation checkpoint — full end-to-end smoke

**Files:** None modified — verification only.

Before building the real animations, verify the library shell works end-to-end with placeholders.

- [ ] **Step 1: Cold reload check**

Close all browser tabs for the library. Reopen `index.html`.

Expected:
- Page loads with `5 references` subtitle
- Tab bar shows all 8 tabs with correct counts (Hero 1, Nav 0, Cards 1, Buttons 1, Text 1, Images 0, Background 1, Page transitions 0)
- The "Hero" tab is auto-active (first category with entries)
- Hero tile (2×2) shows with the dark placeholder iframe content

- [ ] **Step 2: Tab navigation check**

Click through every tab.

Expected:
- Each tab with entries shows a tile + placeholder
- Each empty tab shows the empty-state message
- The active tab indicator (underline) moves correctly
- No console errors at any point

- [ ] **Step 3: Search check**

Try these searches:
- `text` → 1 match (Text line reveal)
- `background` → 1 match
- `hero` → matches both name and category
- `` (empty) → returns to active tab

- [ ] **Step 4: Tests page check**

Open `tests.html`.

Expected: `10 passed, 0 failed`.

- [ ] **Step 5: Run the tests page once more after clearing browser cache**

Browser DevTools → Network → Disable cache (and reload).

Expected: same `10 passed, 0 failed`.

No commit for this task — it's verification only. If any check fails, fix the regression before proceeding.

---

## Task 11: Replace placeholder #001 with real "Card tilt hover" animation

**Files:**
- Modify: `references/001-card-tilt-hover/animation.html`

Implements the actual self-demoing GSAP animation. Pattern: load GSAP from CDN, set up the effect, drive it programmatically on a timer to simulate the trigger.

- [ ] **Step 1: Replace the placeholder with the real animation**

Path: `references/001-card-tilt-hover/animation.html` — overwrite entire file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Card tilt hover</title>
<style>
  html, body {
    margin: 0; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #f4f1ee, #e8e2dc);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    overflow: hidden;
  }
  .scene { perspective: 800px; width: 60%; aspect-ratio: 1.2 / 1; }
  .card {
    width: 100%; height: 100%;
    background: #ffffff;
    border-radius: 14px;
    box-shadow: 0 12px 30px rgba(0,0,0,0.08);
    transform-style: preserve-3d;
    will-change: transform;
    display: flex; align-items: center; justify-content: center;
    color: #ccc; font-size: 12px;
  }
</style>
</head>
<body>
  <div class="scene"><div class="card" id="card">card</div></div>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const card = document.getElementById("card");

    // Self-demo: cycle through a few "cursor positions" on the card to show tilt.
    // Each position holds for ~700ms, then transitions to the next in ~600ms.
    const positions = [
      { rotX:  8, rotY: -12 },
      { rotX:  8, rotY:  12 },
      { rotX: -8, rotY:  12 },
      { rotX: -8, rotY: -12 },
      { rotX:  0, rotY:   0 },  // rest
    ];

    const tl = gsap.timeline({ repeat: -1, defaults: { duration: 0.6, ease: "power2.out" } });
    positions.forEach(p => {
      tl.to(card, { rotationX: p.rotX, rotationY: p.rotY }).to(card, { duration: 0.7 }); // hold
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify in browser — standalone**

Open `references/001-card-tilt-hover/animation.html` directly.

Expected:
- A white card on tan background, centered
- Card slowly tilts through four corners on a loop (~6.5s round trip)
- Smooth animation, no flicker
- No console errors

- [ ] **Step 3: Verify in browser — in library**

Open `index.html`, click "Cards" tab.

Expected:
- Tile shows the live tilt animation inside the iframe
- Caption: "Card tilt hover"

- [ ] **Step 4: Commit**

```bash
git add references/001-card-tilt-hover/animation.html
git commit -m "feat: implement card tilt hover reference animation

GSAP timeline cycles a 3D tilt through four corner positions with rests
between, looping indefinitely. Shows the cursor-follow tilt effect
without requiring a real cursor.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Replace placeholder #002 with real "Text line reveal" animation

**Files:**
- Modify: `references/002-text-line-reveal/animation.html`

- [ ] **Step 1: Replace the placeholder**

Path: `references/002-text-line-reveal/animation.html` — overwrite entire file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Text line reveal</title>
<style>
  html, body {
    margin: 0; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: #fff5e6;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    overflow: hidden;
  }
  .stack {
    display: flex; flex-direction: column; gap: 10px;
    width: 75%;
  }
  .line {
    height: 14px;
    background: #2a2418;
    border-radius: 3px;
    will-change: transform, opacity;
  }
  .line.short { width: 60%; }
  .line.shorter { width: 40%; }
</style>
</head>
<body>
  <div class="stack" id="stack">
    <div class="line"></div>
    <div class="line"></div>
    <div class="line short"></div>
    <div class="line shorter"></div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const lines = document.querySelectorAll(".line");

    // Self-demo: lines stagger in from below, hold, then reset and replay.
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power3.out" } });
    tl.set(lines, { y: 28, opacity: 0 })
      .to(lines, { y: 0, opacity: 1, duration: 0.7, stagger: 0.12 })
      .to({}, { duration: 1.6 })  // hold
      .to(lines, { opacity: 0, duration: 0.4, stagger: { each: 0.05, from: "end" } })
      .to({}, { duration: 0.3 }); // pause before loop
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify standalone**

Open `references/002-text-line-reveal/animation.html`.

Expected:
- Four dark horizontal bars on warm cream background
- Bars stagger in from below (top-to-bottom), pause briefly, fade out from bottom-up, then repeat
- Loop duration ~3.5s

- [ ] **Step 3: Verify in library**

Open `index.html`, click "Text" tab.

Expected: tile shows the looping reveal.

- [ ] **Step 4: Commit**

```bash
git add references/002-text-line-reveal/animation.html
git commit -m "feat: implement text line reveal reference animation

Staggered bars rise into view from below, hold, fade out in reverse,
and loop. Demonstrates a typical multi-line text reveal pattern.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Replace placeholder #003 with real "Magnetic button" animation

**Files:**
- Modify: `references/003-magnetic-button/animation.html`

- [ ] **Step 1: Replace the placeholder**

Path: `references/003-magnetic-button/animation.html` — overwrite entire file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Magnetic button</title>
<style>
  html, body {
    margin: 0; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: #e8f0ff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    overflow: hidden;
  }
  .btn {
    background: #111; color: #fff;
    padding: 14px 28px;
    border-radius: 999px;
    font-size: 14px; font-weight: 500;
    will-change: transform;
    cursor: pointer;
  }
</style>
</head>
<body>
  <div class="btn" id="btn">Click me</div>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const btn = document.getElementById("btn");

    // Self-demo: simulate a cursor approaching from various angles, pulling the
    // button toward it, then releasing.
    // Each position holds for a moment so the user can see the "pulled" state.
    const offsets = [
      { x:  12, y:  -6 },
      { x: -12, y:  -6 },
      { x: -12, y:   6 },
      { x:  12, y:   6 },
      { x:   0, y:   0 },  // rest
    ];

    const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power3.out" } });
    offsets.forEach(o => {
      tl.to(btn, { x: o.x, y: o.y, duration: 0.5 })
        .to({}, { duration: 0.5 });
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify standalone**

Open `references/003-magnetic-button/animation.html`.

Expected:
- Black pill button on light-blue background
- Button drifts subtly toward four corners then returns to center, on a loop
- Smooth, slightly overshooting feel

- [ ] **Step 3: Verify in library**

Open `index.html`, click "Buttons" tab. Tile shows the drifting button.

- [ ] **Step 4: Commit**

```bash
git add references/003-magnetic-button/animation.html
git commit -m "feat: implement magnetic button reference animation

Button is translated toward simulated cursor positions in each corner
on a loop, demonstrating the cursor-magnet hover behavior without
needing a real cursor.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Replace placeholder #004 with real "Gradient breathing" animation

**Files:**
- Modify: `references/004-gradient-breathing/animation.html`

- [ ] **Step 1: Replace the placeholder**

Path: `references/004-gradient-breathing/animation.html` — overwrite entire file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Gradient breathing</title>
<style>
  html, body {
    margin: 0; height: 100%; overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  body {
    background: linear-gradient(135deg, #f7f1ff 0%, #ffeaf0 100%);
    background-size: 200% 200%;
    will-change: background-position, filter;
  }
</style>
</head>
<body>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    // Self-demo: the gradient slowly drifts back and forth, with a subtle hue
    // shift on a longer cycle. Continuous ambient effect — no trigger needed.
    gsap.to(document.body, {
      backgroundPosition: "100% 100%",
      duration: 6,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    gsap.to(document.body, {
      filter: "hue-rotate(40deg)",
      duration: 11,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify standalone**

Open `references/004-gradient-breathing/animation.html`.

Expected:
- Soft pink-to-lavender gradient filling the viewport
- The gradient slowly drifts (~6s cycle)
- Colors gradually hue-shift on a slower cycle (~11s) — subtle, not jarring
- No visible "jumps" or flickers

- [ ] **Step 3: Verify in library**

Open `index.html`, click "Background" tab. The fullrow tile shows the breathing gradient.

- [ ] **Step 4: Commit**

```bash
git add references/004-gradient-breathing/animation.html
git commit -m "feat: implement gradient breathing reference animation

Two looping yoyo tweens drive the background gradient: a 6s position
drift and an 11s hue rotation. Ambient/continuous — no trigger needed.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 15: Replace placeholder #005 with real "Hero text cascade" animation

**Files:**
- Modify: `references/005-hero-text-cascade/animation.html`

- [ ] **Step 1: Replace the placeholder**

Path: `references/005-hero-text-cascade/animation.html` — overwrite entire file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Hero text cascade</title>
<style>
  html, body {
    margin: 0; height: 100%; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    background: #0f0f10;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #ffffff;
  }
  h1 {
    font-size: clamp(28px, 6vw, 56px);
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0;
    line-height: 1;
  }
  .char {
    display: inline-block;
    will-change: transform, opacity;
  }
</style>
</head>
<body>
  <h1 id="title"></h1>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const TEXT = "Hello.";
    const title = document.getElementById("title");

    // Split into character spans (preserving spaces).
    title.innerHTML = TEXT.split("").map(ch =>
      ch === " " ? "&nbsp;" : `<span class="char">${ch}</span>`
    ).join("");

    const chars = document.querySelectorAll(".char");

    const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power4.out" } });
    tl.set(chars, { y: 80, opacity: 0, rotationX: -60 })
      .to(chars, { y: 0, opacity: 1, rotationX: 0, duration: 0.9, stagger: 0.06 })
      .to({}, { duration: 1.4 })
      .to(chars, { y: -40, opacity: 0, duration: 0.5, stagger: { each: 0.04, from: "end" } })
      .to({}, { duration: 0.5 });
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify standalone**

Open `references/005-hero-text-cascade/animation.html`.

Expected:
- Dark near-black background, white "Hello." centered
- Each character flies in from below with a slight 3D rotation, staggered
- Holds briefly, then characters lift away from end-to-start
- Loops indefinitely

- [ ] **Step 3: Verify in library**

Open `index.html`. The Hero tab should be active by default and show the 2×2 tile with the cascade.

- [ ] **Step 4: Commit**

```bash
git add references/005-hero-text-cascade/animation.html
git commit -m "feat: implement hero text cascade reference animation

Per-character stagger with 3D rotation entrance, hold, and exit in
reverse. Loops indefinitely. Demonstrates classic hero entrance.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 16: Write the project CLAUDE.md and README.md

**Files:**
- Create: `CLAUDE.md`
- Create: `README.md`

- [ ] **Step 1: Create `CLAUDE.md`** (for future Claude sessions)

Path: `CLAUDE.md`

```markdown
# CLAUDE.md — GSAP Reference Library

## What this project is

A designer's personal visual reference library of GSAP animations. The designer browses live animations in `index.html` to find inspiration, then asks Claude to recreate a chosen reference inside another project. The designer does not read or write code; Claude does all file operations.

## Architecture (read the spec)

Full design is at `docs/superpowers/specs/2026-05-21-gsap-reference-library-design.md`. Read it before making structural changes.

## Required workflow when adding a new reference

The designer says something like *"Add the card hover from stripe.com to my library"* or *"Save this CodePen"*. Before saving anything:

1. **Verify you have all required inputs.** If any of these is missing, ASK the designer first:
   - **Source URL** — always required. If the designer didn't provide one, ask.
   - **Category** — designer must specify explicitly. Do NOT pick on her behalf. One of:
     `Hero | Nav | Cards | Buttons | Text | Images | Background | Page transitions`
   - **Size** — designer must specify explicitly. One of: `1x1 | 2x2 | fullrow`
2. **Inspect the source.** Browse to the URL, watch the CodePen demo, view the video. Understand the effect before recreating.
3. **If you cannot achieve a high-fidelity reproduction, STOP and tell the designer.** Describe what you can match and what you can't. Let her decide whether to accept an approximation or skip the entry. Do not save a low-fidelity entry silently.
4. **Choose the next sequential ID.** Look at `references.js` and at the `references/` folder. The next ID is `NNN-slug` where `NNN` is one higher than the current max, zero-padded to 3 digits.

## How to add an entry (file operations)

1. Create folder: `references/NNN-slug/`
2. Create `references/NNN-slug/animation.html` using the self-demo template (see below)
3. Append a new object to `window.REFERENCES` in `references.js` with:
   ```js
   { id: "NNN-slug", name: "...", category: "...", size: "...", source: "...", added: "YYYY-MM-DD", notes: "..." }
   ```
4. Tell the designer the entry has been added and ask her to refresh `index.html`.

## Self-demo template for `animation.html`

Each animation must be a complete, self-contained HTML file that animates visibly **without human interaction**. Use this skeleton:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>[Name]</title>
<style>
  html, body { margin: 0; height: 100%; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    background: [...]; }
  /* effect-specific styles */
</style>
</head>
<body>
  <!-- effect markup -->
  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    // Build the effect.
    // Then drive its trigger on a loop. Common patterns:
    //   - gsap.timeline({ repeat: -1 }) with .to() + .to({},{duration:hold}) for pauses
    //   - gsap.to(target, { ..., repeat: -1, yoyo: true })
  </script>
</body>
</html>
```

For triggers that genuinely need real input (e.g., draggable physics), use a static "preview state" and add a small overlay like `▶ click to interact`. Do not invent fake interaction.

## Things you must NOT do

- Do not invent new categories outside the fixed list. If the designer requests one, ask whether she wants to add it; if yes, the addition is a separate task (edit `library.js`'s `CATEGORIES` array).
- Do not auto-decide the category or size on the designer's behalf.
- Do not save a reference without an explicit source URL.
- Do not switch from `references.js` back to `references.json` — the file-protocol fetch issue is real.
- Do not introduce a build step, package.json, or Node dependency. The library must always be openable by double-clicking `index.html`.

## Editing/deleting entries

- **Rename:** edit the `name` field in `references.js`
- **Recategorize:** edit `category` in `references.js`
- **Resize:** edit `size` in `references.js`
- **Delete:** remove the object from `references.js` AND delete the folder `references/NNN-slug/`
- **Iterate animation:** edit `references/NNN-slug/animation.html`

## Performance constraints

The lazy-mount in `library.js` keeps active iframe count to ~6-12 regardless of total entries. Do not break this:
- Do not eagerly mount iframes in `createTile`
- Do not disable `unmountAllIframes` on tab switch
- Do not raise `rootMargin` significantly above 200px

## Tests

Open `tests.html` in the browser to verify `library.js` pure functions still pass. If you modify `matchesQuery` or `countByCategory`, update or extend the tests in `tests.js`.

## Git workflow

Per parent `C:\ClaudeProjects\.claude\CLAUDE.md`:
- Feature branches off `main` for all changes
- Commit messages: `type: description` (feat/fix/refactor/docs/test)
- Never push to main directly
```

- [ ] **Step 2: Create `README.md`** (designer-facing)

Path: `README.md`

```markdown
# GSAP Reference Library

A personal visual library of GSAP animations — a swipe file for design references.

## How to use it

**Open the library:** Double-click `index.html`. It opens in your default browser. No setup, no server, nothing to install.

**Browse:** Click a category tab at the top (`Hero`, `Cards`, `Buttons`, etc.) to see all references in that category. Each tile is a live, looping animation showing the effect.

**Search:** Type in the search box (top-right) to find a reference by name, category, or notes. The grid updates instantly.

**Open the original source:** Click the `↗` link under any tile to open the website the animation was inspired by.

## How to add a new reference

You don't add references yourself. Instead, open a Claude Code session in this folder and tell Claude:

> *"Add the card hover from stripe.com — category: Cards, size: 1x1"*

> *"Save this CodePen: [URL] — Buttons, 1x1, source link the codepen"*

Claude will:
1. Look at the source
2. Tell you if it can recreate it faithfully (and warn you if it can't)
3. Save the animation
4. Tell you to refresh `index.html`

When adding, always specify three things:
- **Source URL** (where the animation came from)
- **Category** (one of the tabs)
- **Size** (`1x1`, `2x2`, or `fullrow`)

## How to change a reference

Just tell Claude in plain English:
- *"Rename reference #14 to 'Soft tilt'"*
- *"Move that one to Buttons"*
- *"Make it a 2x2"*
- *"Delete reference #7"*
- *"The tilt on #1 is too aggressive — soften it"*

## File structure (you can ignore this — it's for Claude)

```
gsap-reference-library/
├── index.html              ← the page you open
├── styles.css              ← styling
├── library.js              ← UI logic
├── references.js           ← metadata for every entry
└── references/             ← one folder per entry, each with animation.html
```

## When you want to use a reference in another project

Open a Claude Code session in your other project and say something like:

> *"In my GSAP library, reference #14 is the card tilt I want for this page's hero cards. Implement it here."*

Claude will read the reference and port the effect into your project's stack.

## Tested in

- Chrome, Edge, Firefox (latest)
- Opens via `file://` — no web server required
```

- [ ] **Step 3: Verify by reading**

Open both files. Confirm:
- `CLAUDE.md` has the explicit workflow rules (ask before saving low-fi, designer chooses category + size, source URL required)
- `README.md` is written for the designer (no code, no jargon, plain English)

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: add project CLAUDE.md and designer-facing README

CLAUDE.md captures the workflow rules (designer specifies category+size,
ask before saving low-fidelity, never invent categories, never break
file:// loading) plus the self-demo template for future entries.

README.md is the designer-facing guide: how to open the library, how to
ask Claude to add/edit references, and how to invoke references from
other projects.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 17: Final smoke test and merge to main

**Files:** None modified.

- [ ] **Step 1: Final cold reload smoke**

Close all browser windows. Reopen `index.html`.

Run through every category tab:
- **Hero** — 2×2 tile with character cascade looping
- **Nav** — empty state
- **Cards** — 1×1 tile with card tilting through corners
- **Buttons** — 1×1 tile with button drifting through corners
- **Text** — 1×1 tile with line reveal looping
- **Images** — empty state
- **Background** — fullrow tile with breathing gradient
- **Page transitions** — empty state

Each animation is smooth and visibly playing.

- [ ] **Step 2: Search smoke**

- `card` → 1 match (entry count subtitle updates)
- `gradient` → 1 match
- `cards` → 1 match (matches via category)
- empty → returns to active tab

- [ ] **Step 3: Tests page**

Open `tests.html`. Confirm `10 passed, 0 failed`.

- [ ] **Step 4: DevTools resource check**

Open DevTools → Memory or Performance tab → Click "Cards" tab.

In Elements panel, confirm only the Cards tile contains an `<iframe>` (Hero tile is unmounted).

- [ ] **Step 5: Merge to main**

```bash
git checkout main
git merge --no-ff feat/v1-initial-implementation -m "feat: v1 initial implementation of GSAP reference library

Static HTML library with tabbed categories, lazy-mounted iframes,
search, and 5 seeded GSAP animations. Pure file:// loading — no build,
no server. Includes test runner page and project documentation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

Then verify:

```bash
git log --oneline -10
```

Expected: see the merge commit and recent feature commits on `main`.

- [ ] **Step 6: Verification before completion**

Open `index.html` from `main` one final time. Confirm everything works.

Optionally clean up the feature branch:

```bash
git branch -d feat/v1-initial-implementation
```

---

## Self-review (run after writing this plan)

**Spec coverage:**
- ✅ Folder structure → Tasks 1-15 create exactly the files listed in spec
- ✅ Data model fields (id, name, category, size, source, added, notes) → seeded in Task 2, documented in Task 16 CLAUDE.md
- ✅ Categories list (8 tabs) → CATEGORIES constant in Task 2
- ✅ Library UI (title strip, search, tabs, grid) → Tasks 1-3
- ✅ Self-demo per-entry → Pattern shown in Task 11; applied in 12-15
- ✅ Lazy-mount via IntersectionObserver → Task 5
- ✅ Tab isolation (unmount on switch) → Task 6
- ✅ Search across name/notes/category → Task 7
- ✅ Empty state → Task 3 Step 6 and Task 7
- ✅ Variable tile sizes (1x1/2x2/fullrow) → CSS in Task 1, verification in Task 3
- ✅ 3-5 seeded starter entries spanning categories → 5 seeds (Tasks 11-15) covering Cards, Text, Buttons, Background, Hero
- ✅ CLAUDE.md content → Task 16
- ✅ README.md → Task 16
- ✅ Workflow rules (designer specifies category/size; source URL required; ask before low-fi) → encoded in CLAUDE.md (Task 16)

**Placeholder scan:** No TBD/TODO entries. Every code block is complete. Every step shows actual content.

**Type consistency:** Function names checked — `mountIframe`, `unmountIframe`, `unmountAllIframes`, `setupLazyMount`, `renderGrid`, `renderTabs`, `renderSearchResults`, `setActiveCategory`, `matchesQuery`, `countByCategory`, `renderEntryCount` all match between definition and call sites across tasks.

**Test deviation acknowledged:** No formal TDD per the constraint "no Node, no build step." Manual browser verification at each task. `tests.html` is the closest available analog for pure-JS logic.
