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
  renderGrid();
}

function renderEntryCount() {
  document.getElementById("entry-count").textContent =
    `${REFERENCES.length} reference${REFERENCES.length === 1 ? "" : "s"}`;
}

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

function init() {
  renderEntryCount();
  renderTabs();
  // Default to first category that has entries; fall back to first category.
  const firstWithEntries = CATEGORIES.find(c => REFERENCES.some(r => r.category === c));
  setActiveCategory(firstWithEntries || CATEGORIES[0]);
}

document.addEventListener("DOMContentLoaded", init);
