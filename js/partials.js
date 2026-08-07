/**
 * partials.js — injects the shared header/nav and footer.
 *
 * Security note: the markup below is a fixed, developer-authored
 * constant containing no user-controlled data, so assigning it with
 * innerHTML here does not create an XSS risk (nothing from a query
 * string, file name, or form field is ever concatenated into it).
 * Anything derived from user input elsewhere in the app is rendered
 * with textContent / DOM APIs instead — see pdf-engine.js and tools.js.
 */
"use strict";

(function () {
  const NAV_LINKS = [
    ["index.html", "Home"],
    ["all-tools.html", "All Tools"],
    ["blog.html", "Blog"],
    ["faq.html", "FAQ"],
    ["about.html", "About"],
    ["contact.html", "Contact"],
  ];

  function currentPath() {
    const p = window.location.pathname.split("/").pop() || "index.html";
    return p;
  }

  function headerHTML() {
    const here = currentPath();
    const links = NAV_LINKS.map(([href, label]) => {
      const file = href.split("/").pop();
      const current = file === here ? ' aria-current="page"' : "";
      return `<a href="${href}"${current}>${label}</a>`;
    }).join("");

    return `
      <a class="skip-link" href="#main-content">Skip to content</a>
      <header class="site-header">
        <div class="nav">
          <a class="brand" href="index.html">
            <span class="brand-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/><path d="M15 2v5h5" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 13.5h7M8.5 16.5h4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </span>
            PDF Ultra Pro
          </a>
          <nav class="nav-links" id="nav-links" aria-label="Primary">${links}</nav>
          <div class="nav-actions">
            <button class="theme-toggle" data-theme-toggle type="button" aria-label="Toggle dark mode">
              <span data-theme-icon aria-hidden="true">🌙</span>
            </button>
            <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Toggle menu" aria-expanded="false" aria-controls="nav-links">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
      </header>`;
  }

  function footerHTML() {
    const year = new Date().getFullYear();
    return `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-col">
              <a class="brand" href="index.html" style="margin-bottom:14px;">
                <span class="brand-mark">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/></svg>
                </span>
                PDF Ultra Pro
              </a>
              <p>Every PDF tool you need, processed entirely in your browser. Nothing you upload ever leaves your device.</p>
              <div class="footer-social">
                <a href="https://twitter.com" aria-label="Twitter" rel="noopener noreferrer" target="_blank"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.7A11.6 11.6 0 0 1 3.4 4.6a4.1 4.1 0 0 0 1.3 5.5c-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.6 3.3 4a4.2 4.2 0 0 1-1.9.1 4.1 4.1 0 0 0 3.8 2.9A8.3 8.3 0 0 1 2 18.4a11.6 11.6 0 0 0 6.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1Z" fill="currentColor"/></svg></a>
                <a href="https://github.com" aria-label="GitHub" rel="noopener noreferrer" target="_blank"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1-1.5-1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1a10 10 0 0 1 5.2 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.8-4.6 5 .3.3.6.9.6 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" fill="currentColor"/></svg></a>
              </div>
            </div>
            <div class="footer-col">
              <h4>Organize</h4>
              <a href="merge-pdf.html">Merge PDF</a>
              <a href="split-pdf.html">Split PDF</a>
              <a href="reorder-pdf.html">Reorder Pages</a>
              <a href="delete-pages.html">Delete Pages</a>
            </div>
            <div class="footer-col">
              <h4>Convert</h4>
              <a href="pdf-to-jpg.html">PDF to JPG</a>
              <a href="word-to-pdf.html">Word to PDF</a>
              <a href="ocr-pdf.html">OCR PDF</a>
              <a href="all-tools.html">All Tools</a>
            </div>
            <div class="footer-col">
              <h4>Edit &amp; Secure</h4>
              <a href="watermark-pdf.html">Watermark</a>
              <a href="sign-pdf.html">Sign PDF</a>
              <a href="crop-pdf.html">Crop PDF</a>
              <a href="page-numbers.html">Page Numbers</a>
            </div>
            <div class="footer-col">
              <h4>Company</h4>
              <a href="about.html">About</a>
              <a href="faq.html">FAQ</a>
              <a href="contact.html">Contact</a>
              <a href="privacy.html">Privacy Policy</a>
              <a href="terms.html">Terms of Service</a>
              <a href="disclaimer.html">Disclaimer</a>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${year} PDF Ultra Pro. All files are processed locally in your browser.</span>
            <span>Made for people who'd rather not upload their documents to a stranger's server.</span>
          </div>
        </div>
      </footer>`;
  }

  function mount() {
    const headerEl = document.getElementById("site-header");
    const footerEl = document.getElementById("site-footer");
    if (headerEl) headerEl.innerHTML = headerHTML();
    if (footerEl) footerEl.innerHTML = footerHTML();

    const toggle = document.getElementById("nav-toggle");
    const links = document.getElementById("nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", () => {
        const isOpen = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(isOpen));
      });
      links.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => {
          links.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
        })
      );
    }

    if (window.PDFUltraTheme) {
      window.PDFUltraTheme.applyTheme(document.documentElement.getAttribute("data-theme"));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
