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
