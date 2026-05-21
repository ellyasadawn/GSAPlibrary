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

const VALID_SIZES = new Set(["1x1", "2x2", "fullrow"]);

function safeHref(url) {
  try {
    const parsed = new URL(url);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") ? url : "#";
  } catch {
    return "#";
  }
}

function createTile(entry) {
  const tile = document.createElement("div");
  const size = VALID_SIZES.has(entry.size) ? entry.size : "1x1";
  tile.className = `tile size-${size}`;
  tile.dataset.id = entry.id;
  tile.dataset.path = `references/${entry.id}/animation.html`;
  tile.dataset.name = entry.name;

  const frameContainer = document.createElement("div");
  frameContainer.className = "tile-frame-container";
  // iframe is mounted/unmounted by the IntersectionObserver in setupLazyMount().

  const meta = document.createElement("div");
  meta.className = "tile-meta";
  meta.innerHTML = `
    <span class="tile-name">${escapeHTML(entry.name)}</span>
    <a class="tile-source" href="${escapeHTML(safeHref(entry.source))}" target="_blank" rel="noopener">↗</a>
  `;

  tile.appendChild(frameContainer);
  tile.appendChild(meta);
  return tile;
}

function renderGrid() {
  // Tear down current tab's iframes and observer before re-rendering.
  if (intersectionObserver) intersectionObserver.disconnect();
  unmountAllIframes();

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
  setupLazyMount();
}

let intersectionObserver = null;

function mountIframe(tile) {
  const container = tile.querySelector(".tile-frame-container");
  if (!container || container.querySelector("iframe")) return;
  const iframe = document.createElement("iframe");
  iframe.src = tile.dataset.path;
  iframe.title = tile.dataset.name || tile.dataset.id;
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
  const q = query.toLowerCase();
  if (entry.name.toLowerCase().includes(q)) return true;
  if (entry.notes && entry.notes.toLowerCase().includes(q)) return true;
  if (entry.category.toLowerCase().includes(q)) return true;
  return false;
}

function countByCategory(references, category) {
  return references.filter(r => r.category === category).length;
}

// Expose for tests.html
window.__libraryInternals = { matchesQuery, countByCategory };

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

function init() {
  renderEntryCount();
  renderTabs();
  setupSearch();
  // Default to first category that has entries; fall back to first category.
  const firstWithEntries = CATEGORIES.find(c => REFERENCES.some(r => r.category === c));
  setActiveCategory(firstWithEntries || CATEGORIES[0]);
}

document.addEventListener("DOMContentLoaded", init);
