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
