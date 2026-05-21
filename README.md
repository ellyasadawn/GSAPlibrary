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
