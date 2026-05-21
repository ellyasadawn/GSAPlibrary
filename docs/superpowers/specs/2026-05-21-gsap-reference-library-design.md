# GSAP Reference Library — Design Spec

**Date:** 2026-05-21
**Status:** Approved, awaiting implementation plan
**Owner:** jojo.summar@gmail.com

## Purpose

A personal visual reference library of GSAP animations, designed for a **designer's** workflow: browse live, looping animations to find one that fits a project, then instruct Claude to implement that reference in the real project.

The designer never reads or writes code in this library. Claude builds and maintains every file. The library's only consumer-facing surface is the visual grid of animations.

## User context

- **Designer, not developer.** Does not want to learn GSAP code. Reads animations visually only.
- **Sole user.** No collaboration, sharing, or multi-user concerns in v1.
- **Curator role.** Decides what gets added, the category, the size, and whether iterations meet the bar. Claude implements; designer directs.

## Goals

1. Provide a visual-first catalogue of GSAP animation references that designer can browse on her own machine
2. Each entry shows actual motion (live animation, not GIF/video) so timing and feel are accurate
3. Scale gracefully to 50-150 entries without performance issues
4. Make the loop of "find an animation I like → add it to the library" frictionless
5. When designer wants to use a reference in a real project, the underlying code must be readable enough for Claude to port it

## Non-goals

- Not a learning tool. Code is not exposed in the UI.
- Not a collaboration platform. No accounts, sharing, comments.
- Not deployed. Runs as pure local static HTML (Option A).
- No build step, no Node, no command line required to use.
- No favorites/starring system in v1.
- No editing UI — all metadata edits happen through Claude.

## Architecture

### Folder structure

```
gsap-reference-library/
├── index.html                    # Main browse UI (the page she double-clicks)
├── styles.css                    # UI styling
├── library.js                    # Grid, tabs, lazy-mount, search logic
├── references.json               # Master metadata list
├── references/
│   ├── 001-stripe-card-tilt/
│   │   ├── animation.html        # Self-contained working animation
│   │   └── notes.md (optional)   # Per-entry notes
│   ├── 002-apple-text-reveal/
│   │   └── animation.html
│   └── ...
├── CLAUDE.md                     # Project instructions for future Claude sessions
├── README.md                     # Guide for the designer
└── .gitignore
```

### Data model

`references.json` is the single source of truth. The UI reads it on load and builds the grid from it.

```json
[
  {
    "id": "001-stripe-card-tilt",
    "name": "Stripe-style card tilt",
    "category": "Cards",
    "size": "1x1",
    "source": "https://stripe.com",
    "added": "2026-05-21",
    "notes": "Subtle 3D tilt following cursor. Premium feel."
  }
]
```

**Field rules:**
- `id` — kebab-case slug prefixed by a 3-digit sequence number (`001`, `002`, ...). Matches the folder name under `references/`.
- `name` — human-readable label shown under the tile. Designer-given (or Claude-suggested then designer-confirmed).
- `category` — exactly one of the categories listed below. Designer chooses explicitly.
- `size` — one of `"1x1"`, `"2x2"`, `"fullrow"`. Designer chooses explicitly.
- `source` — URL of the original animation. **Required.** If designer doesn't provide one when adding, Claude asks.
- `added` — ISO date the entry was added.
- `notes` — optional free text. If long, store in `references/<id>/notes.md` instead and put a short summary here.

### Categories (tab dimension)

`Hero`, `Nav`, `Cards`, `Buttons`, `Text`, `Images`, `Background`, `Page transitions`

Each tab shows only entries of that category. No "All" tab — designer always picks one. The category list is fixed for v1; new categories can be added by editing `library.js` (with Claude's help).

### Library UI

**Layout:**
- Title strip with library name + entry count
- Search input top-right (searches name and notes across all categories; selecting a result jumps to that tab and scrolls to the entry)
- Horizontal tab bar (one tab per category, count badge per tab, active tab underlined)
- Grid below: CSS Grid, 3 columns, 20px gap, variable row heights to support 2×2 and full-row spans

**Per-tile rendering:**
- An `<iframe>` containing the entry's `animation.html`
- Caption strip below: name + `↗` link to the source URL
- Tile shape:
  - `1x1` → square (`aspect-ratio: 1/1`)
  - `2x2` → spans 2 columns × 2 rows (`grid-column: span 2; grid-row: span 2`)
  - `fullrow` → spans all 3 columns, with a wider aspect ratio (`grid-column: 1 / -1`, `aspect-ratio: ~3.2/1`)

**Empty state:** When `references.json` is `[]` or a tab has zero entries, show a friendly message like *"No references in this category yet. Tell Claude to add one."*

### Per-entry self-demo behavior

Each `animation.html` is a complete tiny webpage that includes the GSAP CDN, builds the effect, and **auto-cycles its trigger** so motion is visible without human interaction:

| Original trigger | What the entry does in the grid |
|---|---|
| Hover | Auto-simulates hover-in → effect → hover-out every ~3s |
| Click | Auto-clicks itself every ~4s and resets |
| Scroll-triggered reveal | Loops reveal → reset → reveal |
| Page-load entrance | Replays entrance every ~3-4s |
| Continuous/ambient | Already loops naturally |

**Exception:** Effects that genuinely require human input (e.g., a draggable physics demo) display a static "preview state" with a small `▶ click to interact` overlay. Clicking expands the tile to a focus view where the designer can interact with it.

### Performance: lazy-mount

50-150 simultaneous iframes would melt the browser. Two safeguards:

1. **Tab isolation** — only the currently active tab's iframes exist in the DOM. Switching tabs unmounts the previous tab's iframes.
2. **Lazy-mount within a tab** — `IntersectionObserver` mounts a tile's iframe only when it enters (or is near) the viewport, and unmounts it when it leaves. Effective concurrent iframe count stays around 6-12 regardless of total library size.

Implementation: tile container divs are always present (so the grid layout is stable), but the `<iframe>` element is added/removed inside them as the user scrolls.

## Workflows

### Adding a new reference

1. Designer provides: a source (URL, CodePen, screenshot, video, or description), a category, and a size
2. Claude verifies it has everything required:
   - Source URL? If missing, ask.
   - Category? Designer must specify.
   - Size? Designer must specify.
3. Claude inspects the source (browses to it, watches CodePen, etc.) and attempts to recreate the effect
4. If Claude cannot achieve high-fidelity reproduction, **Claude pauses and tells the designer before saving anything.** Designer decides whether to accept an approximation or skip the entry.
5. Claude creates:
   - `references/NNN-slug/animation.html` (self-demoing)
   - Optional `references/NNN-slug/notes.md` if there's substantial commentary
   - New entry appended to `references.json`
6. Designer refreshes `index.html` to see the new entry

### Iterating on an existing reference

1. Designer says e.g. "make reference #14 slower" or "tone down the bounce"
2. Claude edits `references/014-slug/animation.html`
3. Designer refreshes to see the change

### Editing metadata

All metadata edits flow through Claude:
- "Move reference #7 to the Buttons category" → Claude edits `references.json`
- "Rename reference #12 to 'Whatever'" → Claude edits `references.json`
- "Make reference #3 a 2×2" → Claude edits `references.json`

### Deleting a reference

1. Designer says "delete reference #X" (or by name)
2. Claude removes the `references/NNN-slug/` folder and the corresponding entry from `references.json`

## Initial setup (day-one deliverable)

When the project is first scaffolded:

1. Folder structure created at `C:\ClaudeProjects\gsap-reference-library\`
2. `index.html`, `styles.css`, `library.js` written
3. `references.json` populated with **3-5 starter entries** spanning different categories (e.g., one Card hover, one Text reveal, one Button magnetic effect, one Background ambient)
4. Corresponding `references/NNN-slug/animation.html` files created for each starter
5. `CLAUDE.md` written with project-specific instructions for future sessions:
   - Folder layout reminder
   - Required metadata fields (designer always specifies category + size; source URL required)
   - "Ask before saving if reproduction is low-fidelity" rule
   - Self-demo template / pattern
6. `README.md` written for the designer:
   - How to open the library (double-click `index.html`)
   - How to add new references (the chat-with-Claude loop)
   - Note about which browser to use (modern Chrome/Firefox/Edge)

## CLAUDE.md content (key rules for future sessions)

The project's `CLAUDE.md` must include:

- This is a designer-curated library; designer never writes code
- Required per-entry inputs: source URL (always), category (designer-specified), size (designer-specified)
- If reproduction would be low-fidelity, **pause and ask before saving**
- Self-demo template for `animation.html` (header with GSAP CDN, the effect, the cycling demo loop)
- File naming convention: `NNN-slug` where NNN is the next sequence number
- Never invent categories outside the fixed list
- Never auto-decide category or size without designer input

## Open questions / future considerations

These are deliberately out of scope for v1, listed here so they don't get lost:

- **Deploy to Vercel.** Designer initially picked local-only. If she later wants to browse from her phone or send links to collaborators, the static-file structure can be deployed to Vercel with no code changes. Worth revisiting after ~30 entries.
- **Favorites/starring.** Not in v1. Could be added later as a per-entry boolean + a "starred" tab.
- **Multiple categories per entry.** Currently one category each. If genuine cross-category needs emerge, this could become an array (`categories: ["Cards", "Buttons"]`).
- **Search refinement.** v1 search hits name + notes. If that proves insufficient, could expand to category, source domain, or computed tags.
- **Exporting / sharing single entries.** Future capability to "copy this entry's HTML to clipboard" or download just one self-contained file.
- **Capturing source attribution for the original creator's name** in addition to source URL.

## Success criteria

The library is successful when:
1. The designer can scroll the grid and identify "I want this one" in seconds
2. Animations are visibly playing without any interaction (self-demo works)
3. Adding a new reference takes a single chat exchange (designer describes → Claude implements → designer refreshes)
4. The library remains fast (smooth scrolling, no janky tab switches) even past 100 entries
5. When the designer says "use reference #N in [other project]," Claude can read that one file and port the animation cleanly
