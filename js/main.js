/**
 * main.js — homepage & general site interactivity (search, category
 * filter). No use of eval/innerHTML with dynamic data: all filtering
 * is done by toggling a CSS class based on data attributes.
 */
"use strict";

(function () {
  function initToolSearch() {
    const input = document.getElementById("tool-search-input");
    const cards = document.querySelectorAll("[data-tool-card]");
    if (!input || !cards.length) return;

    input.addEventListener("input", () => {
      // Cap length defensively; this is a client-side filter only.
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
      // No backend is configured for this static export — this simply
      // confirms the action locally rather than pretending to send mail.
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
    // Registered from the root so its scope covers the whole site.
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* offline support is a progressive enhancement — safe to ignore failures */
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initToolSearch();
    initCategoryPills();
    initCounters();
    initContactForm();
    registerServiceWorker();
  });
})();
