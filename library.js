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
