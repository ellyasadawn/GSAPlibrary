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
window.REFERENCES = [
  { id: "001-card-tilt-hover", name: "Card tilt hover", category: "Cards", size: "1x1", source: "https://example.com", added: "2026-05-21" },
  { id: "002-text-line-reveal", name: "Text line reveal", category: "Text", size: "1x1", source: "https://example.com", added: "2026-05-21" },
  { id: "003-magnetic-button", name: "Magnetic button", category: "Buttons", size: "1x1", source: "https://example.com", added: "2026-05-21" },
  { id: "004-gradient-breathing", name: "Gradient breathing", category: "Background", size: "fullrow", source: "https://example.com", added: "2026-05-21" },
  { id: "005-hero-text-cascade", name: "Hero text cascade", category: "Hero", size: "fullrow", source: "https://example.com", added: "2026-05-21" },
  { id: "006-marquee-banner", name: "Marquee banner", category: "Background", size: "fullrow", source: "https://hypefluency.com/en/", added: "2026-05-21" },
];
