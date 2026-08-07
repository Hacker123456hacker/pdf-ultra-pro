/**
 * theme.js — dark/light mode.
 * Security note: only ever writes the literal strings "dark"/"light" to
 * localStorage and to the DOM attribute, never user-controlled input.
 */
"use strict";

(function () {
  const STORAGE_KEY = "pup-theme";

  function getPreferredTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "dark" || saved === "light") return saved;
    } catch (e) {
      /* localStorage may be unavailable (private mode) — fall through */
    }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme) {
    const safeTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", safeTheme);
    try {
      localStorage.setItem(STORAGE_KEY, safeTheme);
    } catch (e) {
      /* ignore storage failures */
    }
    document.querySelectorAll("[data-theme-icon]").forEach((el) => {
      el.textContent = safeTheme === "dark" ? "☀️" : "🌙";
    });
  }

  // Apply immediately to avoid a flash of the wrong theme.
  applyTheme(getPreferredTheme());

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-theme-toggle]");
    if (!btn) return;
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });

  window.PDFUltraTheme = { applyTheme, getPreferredTheme };
})();
