/**
 * partials.js — shared header/nav and footer.
 */
"use strict";

(function () {
  const SITE_ROOT = "https://pdf-ultra-pro.pages.dev/";
  const NAV_LINKS = [
    [SITE_ROOT, "Home"],
    [SITE_ROOT + "all-tools.html", "All Tools"],
    [SITE_ROOT + "blog.html", "Blog"],
    [SITE_ROOT + "faq.html", "FAQ"],
    [SITE_ROOT + "about.html", "About"],
    [SITE_ROOT + "contact.html", "Contact"],
  ];

  function currentPath() {
    const path = window.location.pathname.replace(/\/+$/, "");
    return path === "" || path === "/index.html" ? "/" : path;
  }

  function headerHTML() {
    const here = currentPath();
    const links = NAV_LINKS.map(([href, label]) => {
      const target = new URL(href).pathname.replace(/\/+$/, "") || "/";
      const current = target === here ? ' aria-current="page"' : "";
      return `<a href="${href}"${current}>${label}</a>`;
    }).join("");

    return `
      <a class="skip-link" href="#main-content">Skip to content</a>
      <header class="site-header">
        <div class="nav">
          <a class="brand" href="${SITE_ROOT}">
            <span class="brand-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/><path d="M15 2v5h5" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 13.5h7M8.5 16.5h4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </span>
            PDF Ultra Pro
          </a>
          <nav class="nav-links" id="nav-links" aria-label="Primary">${links}</nav>
          <div class="nav-actions">
            <button class="theme-toggle" data-theme-toggle type="button" aria-label="Toggle dark mode"><span data-theme-icon aria-hidden="true">🌙</span></button>
            <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Toggle menu" aria-expanded="false" aria-controls="nav-links"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
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
              <a class="brand" href="${SITE_ROOT}" style="margin-bottom:14px;">
                <span class="brand-mark"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/></svg></span>
                PDF Ultra Pro
              </a>
              <p>Every PDF tool you need, processed entirely in your browser. Nothing you upload ever leaves your device.</p>
            </div>
            <div class="footer-col">
              <h4>Organize</h4><a href="merge-pdf.html">Merge PDF</a><a href="split-pdf.html">Split PDF</a><a href="reorder-pdf.html">Reorder Pages</a><a href="delete-pages.html">Delete Pages</a>
            </div>
            <div class="footer-col">
              <h4>Convert</h4><a href="pdf-to-jpg.html">PDF to JPG</a><a href="word-to-pdf.html">Word to PDF</a><a href="ocr-pdf.html">OCR PDF</a><a href="${SITE_ROOT}all-tools.html">All Tools</a>
            </div>
            <div class="footer-col">
              <h4>Edit &amp; Secure</h4><a href="watermark-pdf.html">Watermark</a><a href="sign-pdf.html">Sign PDF</a><a href="crop-pdf.html">Crop PDF</a><a href="page-numbers.html">Page Numbers</a>
            </div>
            <div class="footer-col">
              <h4>Company</h4><a href="about.html">About</a><a href="faq.html">FAQ</a><a href="contact.html">Contact</a><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms of Service</a><a href="disclaimer.html">Disclaimer</a>
            </div>
          </div>
          <div class="footer-contact" style="margin:24px 0 18px;padding:18px 22px;border-radius:18px;background:linear-gradient(135deg,rgba(108,76,240,.12),rgba(62,224,232,.12));border:1px solid rgba(108,76,240,.25);box-shadow:0 8px 28px rgba(108,76,240,.10);">
            <strong style="font-size:1rem;">Need help?</strong>
            <a href="tel:+919648660720" style="display:inline-block;margin:5px 8px;padding:7px 13px;border-radius:999px;background:linear-gradient(135deg,#6C4CF0,#3EE0E8);color:#fff;font-weight:800;box-shadow:0 5px 16px rgba(108,76,240,.30);">📞 +91 96486 60720</a>
            <a href="mailto:abhishekv8471@gmail.com" style="display:inline-block;margin:5px 8px;padding:7px 13px;border-radius:999px;background:linear-gradient(135deg,#3EE0E8,#6C4CF0);color:#fff;font-weight:800;box-shadow:0 5px 16px rgba(62,224,232,.25);">✉️ abhishekv8471@gmail.com</a>
          </div>
          <div class="footer-bottom">
            <span>© ${year} PDF Ultra Pro. All files are processed locally in your browser.</span>
            <span class="creator-credit" style="font-weight:800;background:linear-gradient(90deg,#6C4CF0,#3EE0E8,#6C4CF0);background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:creatorGradient 4s linear infinite;text-shadow:0 4px 18px rgba(108,76,240,.18);">✦ Made by Abhishek · Crafted with care to keep your PDFs private, simple and powerful. ✦</span>
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
      links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }));
    }
    if (window.PDFUltraTheme) window.PDFUltraTheme.applyTheme(document.documentElement.getAttribute("data-theme"));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();