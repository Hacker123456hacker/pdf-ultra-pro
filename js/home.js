/* PDF Ultra Pro - homepage behavior */
"use strict";

(function () {
  // Fallback icon renderer: homepage icons must not depend on the large tool engine.
  // The markup is developer-authored and never contains file-derived data.
  const FALLBACK_ICONS = {
    merge: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3v9a5 5 0 0 0 10 0V3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4 3h6M14 3h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 21v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    split: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3h6l6 6v12H6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 3v6h6" stroke="currentColor" stroke-width="1.8"/><path d="M4 14l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    rotate: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12a8 8 0 1 1 2.6 5.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3 17v-5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    trash: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    extract: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M9 12h6M12 9v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    organize: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="8" height="6" rx="1.3" stroke="currentColor" stroke-width="1.7"/><rect x="13" y="4" width="8" height="6" rx="1.3" stroke="currentColor" stroke-width="1.7"/><rect x="3" y="14" width="8" height="6" rx="1.3" stroke="currentColor" stroke-width="1.7"/><rect x="13" y="14" width="8" height="6" rx="1.3" stroke="currentColor" stroke-width="1.7"/></svg>',
    crop: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    watermark: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3s5 5.5 5 9.5a5 5 0 0 1-10 0C7 8.5 12 3 12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    pagenum: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/><text x="12" y="17" font-size="7" text-anchor="middle" fill="currentColor" font-family="sans-serif">12</text></svg>',
    metadata: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="14" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M12 11v-1M12 18v-1M15 14h1M8 14h1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    sign: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 17s2-1 4-1 3 2 5 2 3-2 5-2 4 1 4 1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M6 13 15 4l3 3-9 9-4 1 1-4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    font: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 20 11 4h2l5 16M8 14h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    compress: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9l4-4 4 4M4 15l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 5v14" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="4" width="6" height="16" rx="1.5" stroke="currentColor" stroke-width="1.8"/></svg>',
    wrench: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4l-3 3-2-2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    image: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="10" r="1.6" stroke="currentColor" stroke-width="1.6"/><path d="M4 17l5-5 4 4 3-3 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    text: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 12h7M8.5 15.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    office: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M3 9h18" stroke="currentColor" stroke-width="1.8"/></svg>',
    ocr: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 12h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    eye: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg>',
    compare: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3v18M16 3v18" stroke="currentColor" stroke-width="1.8"/><path d="M4 8h4M16 8h4M4 16h4M16 16h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    lock: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.8"/></svg>',
    unlock: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 7.4-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  };

  function renderHomepageIcons() {
    document.querySelectorAll("[data-icon]").forEach(function (el) {
      const name = el.getAttribute("data-icon");
      if (!el.hasChildNodes() && FALLBACK_ICONS[name]) el.innerHTML = FALLBACK_ICONS[name];
    });
  }

  function initHome() {
    // Render immediately and also use the shared registry when available.
    renderHomepageIcons();
    if (typeof window.initToolIcons === "function") window.initToolIcons(document);
    renderHomepageIcons();

    const input = document.getElementById("tool-search-input");
    const cards = Array.from(document.querySelectorAll("[data-tool-card]"));
    const pills = Array.from(document.querySelectorAll("[data-category-pill]"));
    let category = "all";

    function filterCards() {
      const query = (input ? input.value : "").trim().toLowerCase();
      cards.forEach((card) => {
        const name = (card.getAttribute("data-tool-name") || "").toLowerCase();
        const cardCategory = card.getAttribute("data-tool-category") || "";
        card.hidden = !((!query || name.includes(query)) && (category === "all" || cardCategory === category));
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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initHome);
  else initHome();
})();