/* PDF Ultra Pro - homepage behavior */
"use strict";

(function () {
  function initHome() {
    // Render all homepage tool icons from the standalone icon registry.
    if (typeof window.initToolIcons === "function") {
      window.initToolIcons(document);
    }

    // Tool search and category filters.
    const input = document.getElementById("tool-search-input");
    const cards = Array.from(document.querySelectorAll("[data-tool-card]"));
    const pills = Array.from(document.querySelectorAll("[data-category-pill]"));
    let category = "all";

    function filterCards() {
      const query = (input ? input.value : "").trim().toLowerCase();
      cards.forEach((card) => {
        const name = (card.getAttribute("data-tool-name") || "").toLowerCase();
        const cardCategory = card.getAttribute("data-tool-category") || "";
        const matchesText = !query || name.includes(query);
        const matchesCategory = category === "all" || cardCategory === category;
        card.hidden = !(matchesText && matchesCategory);
      });
    }

    if (input) input.addEventListener("input", filterCards);
    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        category = pill.getAttribute("data-category-pill") || "all";
        pills.forEach((p) => p.classList.toggle("active", p === pill));
        filterCards();
      });
    });

    // Keep the existing animated counters working without requiring another library.
    document.querySelectorAll("[data-counter]").forEach((el) => {
      const target = Number(el.getAttribute("data-counter"));
      if (!Number.isFinite(target)) return;
      const suffix = el.getAttribute("data-suffix") || "";
      const duration = 700;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min(1, (now - start) / duration);
        const value = Math.round(target * (1 - Math.pow(1 - progress, 3)));
        el.textContent = String(value) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHome);
  } else {
    initHome();
  }
})();
