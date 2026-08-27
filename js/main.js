/**
 * main.js — homepage & general site interactivity (search, category
 * filter, tool icons). No use of dynamic user data in HTML.
 */
"use strict";

(function () {
  function loadSharedIcons() {
    if (typeof window.svgIcon === "function") return Promise.resolve();
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "js/icons.js?v=2";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
    });
  }

  function initToolIcons() {
    const icons = document.querySelectorAll("[data-icon]");
    if (!icons.length) return;

    icons.forEach((el) => {
      const name = el.getAttribute("data-icon") || "text";
      try {
        if (typeof window.svgIcon === "function") {
          el.innerHTML = window.svgIcon(name);
          return;
        }
      } catch (_) {
        // Use the safe fallback below if the shared icon registry is unavailable.
      }

      // Fallback guarantees that homepage cards never remain blank if the
      // shared icon registry fails to load.
      el.innerHTML = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M15 2v5h5M8.5 12h7M8.5 15.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    });
  }

  function initToolSearch() {
    const input = document.getElementById("tool-search-input");
    const cards = document.querySelectorAll("[data-tool-card]");
    if (!input || !cards.length) return;

    input.addEventListener("input", () => {
      const q = input.value.slice(0, 100).trim().toLowerCase();
      cards.forEach((card) => {
        const name = (card.getAttribute("data-tool-name") || "").toLowerCase();
        const match = q === "" || name.includes(q);
        card.style.display = match ? "" : "none";
      });
    });
  }

  function initCategoryPills() {
    const pills = document.querySelectorAll("[data-category-pill]");
    const cards = document.querySelectorAll("[data-tool-card]");
    if (!pills.length || !cards.length) return;

    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        const cat = pill.getAttribute("data-category-pill");
        cards.forEach((card) => {
          const cardCat = card.getAttribute("data-tool-category");
          card.style.display = cat === "all" || cardCat === cat ? "" : "none";
        });
      });
    });
  }

  function initCounters() {
    const counters = document.querySelectorAll("[data-counter]");
    counters.forEach((el) => {
      const target = parseInt(el.getAttribute("data-counter"), 10);
      if (Number.isNaN(target)) return;
      let current = 0;
      const step = Math.max(1, Math.round(target / 60));
      const tick = () => {
        current = Math.min(target, current + step);
        el.textContent = current.toLocaleString() + (el.getAttribute("data-suffix") || "");
        if (current < target) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function initContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const status = document.getElementById("contact-status");
      if (status) {
        status.textContent =
          "This demo form doesn't send data anywhere yet — wire it up to your own form backend (e.g. Formspree) or a mailto: action before going live.";
        status.className = "alert alert-info";
      }
      form.reset();
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* offline support is a progressive enhancement — safe to ignore failures */
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await loadSharedIcons();
    initToolIcons();
    initToolSearch();
    initCategoryPills();
    initCounters();
    initContactForm();
    registerServiceWorker();
  });
})();
