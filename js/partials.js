/**
 * partials.js — shared header/nav, footer and SEO enhancements.
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
    [SITE_ROOT + "contact.html", "Contact"]
  ];

  const TOOL_SEO = {
    "merge-pdf": ["Merge PDF Online Privately — Free Browser PDF Merger | PDF Ultra Pro", "Merge PDF files online without uploading them. Combine documents directly in your browser with PDF Ultra Pro's private client-side PDF merger.", "Merge PDF", "Combine multiple PDF files into one document while keeping the files on your device."],
    "split-pdf": ["Split PDF Online Privately — Free PDF Splitter | PDF Ultra Pro", "Split PDF files by page range or individual pages directly in your browser without uploading your documents.", "Split PDF", "Split a large PDF into smaller documents by page range or selected pages."],
    "rotate-pdf": ["Rotate PDF Online — Rotate PDF Pages in Your Browser | PDF Ultra Pro", "Rotate PDF pages online privately. Turn individual pages or complete documents without uploading your files.", "Rotate PDF", "Rotate PDF pages by 90, 180 or 270 degrees directly in your browser."],
    "delete-pages": ["Delete PDF Pages Online — Private PDF Page Remover | PDF Ultra Pro", "Delete unwanted PDF pages online without uploading your document. Remove pages locally in your browser.", "Delete PDF Pages", "Remove unwanted pages from a PDF while keeping the original file on your device."],
    "extract-pages": ["Extract Pages from PDF Online — Private PDF Extractor | PDF Ultra Pro", "Extract selected pages from a PDF directly in your browser without uploading the document.", "Extract PDF Pages", "Create a new PDF from only the pages you select."],
    "reorder-pdf": ["Reorder PDF Pages Online — Private PDF Page Organizer | PDF Ultra Pro", "Rearrange PDF pages directly in your browser. Drag, reorder and save without uploading your document.", "Reorder PDF Pages", "Rearrange pages into the exact order you need before saving the PDF."],
    "crop-pdf": ["Crop PDF Online — Trim PDF Pages Privately | PDF Ultra Pro", "Crop PDF pages directly in your browser. Trim margins and page areas without uploading your files.", "Crop PDF", "Trim unwanted margins or page areas from PDF documents."],
    "watermark-pdf": ["Add Watermark to PDF Online — Private Browser Tool | PDF Ultra Pro", "Add text watermarks to PDF documents directly in your browser without uploading your files.", "Watermark PDF", "Add a custom text watermark across PDF pages."],
    "page-numbers": ["Add Page Numbers to PDF Online — Free Browser Tool | PDF Ultra Pro", "Add page numbers to PDF files directly in your browser. No upload or account required.", "Add PDF Page Numbers", "Insert page numbers into PDF pages before downloading the finished document."],
    "pdf-metadata": ["Edit PDF Metadata Online — Private PDF Metadata Tool | PDF Ultra Pro", "View and edit PDF title, author and metadata directly in your browser without uploading your document.", "PDF Metadata", "Inspect and edit common PDF document properties locally."],
    "sign-pdf": ["Sign PDF Online — Add Your Signature Privately | PDF Ultra Pro", "Sign PDF documents directly in your browser. Draw and place a signature without uploading the file.", "Sign PDF", "Draw a signature and place it on a PDF document."],
    "extract-fonts": ["Extract Fonts from PDF Online — Browser PDF Tool | PDF Ultra Pro", "Extract embedded fonts from PDF files directly in your browser with no server upload.", "Extract Fonts", "Inspect a PDF and extract embedded font resources where supported."],
    "compress-pdf": ["Compress PDF Without Upload — Private Browser PDF Compressor | PDF Ultra Pro", "Compress PDF files directly in your browser without uploading them. Reduce document size privately with PDF Ultra Pro.", "Compress PDF", "Reduce PDF file size while keeping the document usable and readable."],
    "repair-pdf": ["Repair PDF Online — Browser-Based PDF Repair Tool | PDF Ultra Pro", "Attempt to repair damaged PDF files directly in your browser without uploading the document.", "Repair PDF", "Try to recover a PDF that has structural or loading problems."],
    "pdf-to-jpg": ["PDF to JPG Online — Convert PDF Pages Privately | PDF Ultra Pro", "Convert PDF pages to JPG images directly in your browser without uploading your document.", "PDF to JPG", "Render PDF pages as JPG images for easy sharing and reuse."],
    "images-to-pdf": ["Images to PDF Online — JPG PNG to PDF Privately | PDF Ultra Pro", "Convert JPG, PNG and WebP images into a PDF directly in your browser without uploading your files.", "Images to PDF", "Combine images into a single PDF document in your browser."],
    "pdf-to-text": ["PDF to Text Online — Extract PDF Text Privately | PDF Ultra Pro", "Extract selectable text from PDF files directly in your browser without uploading the document.", "PDF to Text", "Extract text from supported PDF documents for copying and reuse."],
    "extract-images": ["Extract Images from PDF Online — Private Browser Tool | PDF Ultra Pro", "Extract embedded images from PDF files directly in your browser without uploading your document.", "Extract Images", "Save images embedded inside a PDF where the document format allows extraction."],
    "word-to-pdf": ["Word to PDF Online — Convert DOCX Privately in Your Browser | PDF Ultra Pro", "Convert supported Word DOCX documents to PDF directly in your browser without uploading the file.", "Word to PDF", "Turn a supported DOCX document into a PDF locally in the browser."],
    "excel-to-pdf": ["Excel to PDF Online — Convert XLSX Privately | PDF Ultra Pro", "Convert supported Excel XLSX spreadsheets to PDF directly in your browser without uploading your workbook.", "Excel to PDF", "Convert spreadsheet content into a PDF directly in your browser."],
    "ppt-to-pdf": ["PowerPoint to PDF Online — Convert PPTX Privately | PDF Ultra Pro", "Convert supported PowerPoint PPTX presentations to PDF in your browser without uploading the file.", "PowerPoint to PDF", "Convert presentation content into a PDF document locally."],
    "ocr-pdf": ["OCR PDF Online — Make Scanned PDFs Searchable Privately | PDF Ultra Pro", "Run OCR on scanned PDF documents directly in your browser. Make supported scans searchable without uploading files.", "OCR PDF", "Recognize text in scanned PDF pages using browser-based OCR."],
    "preview-pdf": ["Preview PDF Online — Private Browser PDF Viewer | PDF Ultra Pro", "Preview PDF documents page by page directly in your browser without uploading your files.", "Preview PDF", "View PDF pages and inspect a document directly in your browser."],
    "compare-pdf": ["Compare PDF Files Online — Private Browser PDF Comparison | PDF Ultra Pro", "Compare two PDF documents directly in your browser and identify supported text differences without uploading them.", "Compare PDFs", "Compare two versions of a PDF to identify changes."],
    "protect-pdf": ["Protect PDF Online — Browser PDF Security Information | PDF Ultra Pro", "Learn why reliable PDF password encryption is not currently offered by this browser-only PDF tool.", "Protect PDF", "Understand the current limitations of client-side PDF password protection."],
    "unlock-pdf": ["Unlock PDF Online — Browser PDF Security Information | PDF Ultra Pro", "Learn why password removal is not currently offered by this browser-only PDF tool.", "Unlock PDF", "Understand the current limitations of client-side PDF password removal."]
  };

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
      <header class="site-header"><div class="nav">
        <a class="brand" href="${SITE_ROOT}"><span class="brand-mark"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/><path d="M15 2v5h5" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 13.5h7M8.5 16.5h4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>PDF Ultra Pro</a>
        <nav class="nav-links" id="nav-links" aria-label="Primary">${links}</nav>
        <div class="nav-actions"><button class="theme-toggle" data-theme-toggle type="button" aria-label="Toggle dark mode"><span data-theme-icon aria-hidden="true">🌙</span></button><button class="nav-toggle" id="nav-toggle" type="button" aria-label="Toggle menu" aria-expanded="false" aria-controls="nav-links"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>
      </div></header>`;
  }

  function footerHTML() {
    const year = new Date().getFullYear();
    return `
      <footer class="site-footer"><div class="container"><div class="footer-grid">
        <div class="footer-col"><a class="brand" href="${SITE_ROOT}" style="margin-bottom:14px;"><span class="brand-mark"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/></svg></span>PDF Ultra Pro</a><p>Every PDF tool you need, processed entirely in your browser. Nothing you upload ever leaves your device.</p></div>
        <div class="footer-col"><h4>Organize</h4><a href="merge-pdf.html">Merge PDF</a><a href="split-pdf.html">Split PDF</a><a href="reorder-pdf.html">Reorder Pages</a><a href="delete-pages.html">Delete Pages</a></div>
        <div class="footer-col"><h4>Convert</h4><a href="pdf-to-jpg.html">PDF to JPG</a><a href="word-to-pdf.html">Word to PDF</a><a href="ocr-pdf.html">OCR PDF</a><a href="${SITE_ROOT}all-tools.html">All Tools</a></div>
        <div class="footer-col"><h4>Edit &amp; Secure</h4><a href="watermark-pdf.html">Watermark</a><a href="sign-pdf.html">Sign PDF</a><a href="crop-pdf.html">Crop PDF</a><a href="page-numbers.html">Page Numbers</a></div>
        <div class="footer-col"><h4>Company</h4><a href="about.html">About</a><a href="faq.html">FAQ</a><a href="contact.html">Contact</a><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms of Service</a><a href="disclaimer.html">Disclaimer</a></div>
      </div>
      <div class="footer-contact" style="margin:24px 0 18px;padding:18px 22px;border-radius:18px;background:linear-gradient(135deg,rgba(108,76,240,.12),rgba(62,224,232,.12));border:1px solid rgba(108,76,240,.25);box-shadow:0 8px 28px rgba(108,76,240,.10);"><strong style="font-size:1rem;">Need help?</strong><a href="tel:+919648660720" style="display:inline-block;margin:5px 8px;padding:7px 13px;border-radius:999px;background:linear-gradient(135deg,#6C4CF0,#3EE0E8);color:#fff;font-weight:800;box-shadow:0 5px 16px rgba(108,76,240,.30);">📞 +91 96486 60720</a><a href="mailto:abhishekv8471@gmail.com" style="display:inline-block;margin:5px 8px;padding:7px 13px;border-radius:999px;background:linear-gradient(135deg,#3EE0E8,#6C4CF0);color:#fff;font-weight:800;box-shadow:0 5px 16px rgba(62,224,232,.25);">✉️ abhishekv8471@gmail.com</a></div>
      <div class="footer-bottom"><span>© ${year} PDF Ultra Pro. All files are processed locally in your browser.</span><span class="creator-credit" style="font-weight:800;background:linear-gradient(90deg,#6C4CF0,#3EE0E8,#6C4CF0);background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:creatorGradient 4s linear infinite;text-shadow:0 4px 18px rgba(108,76,240,.18);">✦ Made by Abhishek · Crafted with care to keep your PDFs private, simple and powerful. ✦</span></div>
      </div></footer>`;
  }

  function addMeta(name, content) {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
    el.content = content;
  }

  function addProperty(property, content) {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) { el = document.createElement("meta"); el.setAttribute("property", property); document.head.appendChild(el); }
    el.content = content;
  }

  function addJSONLD(id, data) {
    let script = document.getElementById(id);
    if (!script) { script = document.createElement("script"); script.type = "application/ld+json"; script.id = id; document.head.appendChild(script); }
    script.textContent = JSON.stringify(data);
  }

  function applySEO() {
    const path = currentPath();
    const file = path.split("/").pop() || "index.html";
    const key = file.replace(/\.html$/, "");
    const tool = TOOL_SEO[key];
    const ogImage = SITE_ROOT + "images/og-image.svg";

    addMeta("robots", "index,follow,max-image-preview:large");
    addProperty("og:image", ogImage);
    addMeta("twitter:image", ogImage);

    if (tool) {
      const [title, description, name, summary] = tool;
      document.title = title;
      addMeta("description", description);
      addProperty("og:title", title);
      addProperty("og:description", description);
      addProperty("og:url", SITE_ROOT + key + ".html");
      addMeta("twitter:title", title);
      addMeta("twitter:description", description);
      const page = SITE_ROOT + key + ".html";
      addJSONLD("seo-tool-schema", {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "PDF Ultra Pro — " + name,
        "url": page,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Web Browser",
        "description": description,
        "offers": {"@type":"Offer","price":"0","priceCurrency":"USD"}
      });
      addJSONLD("seo-tool-faq", {
        "@context":"https://schema.org",
        "@type":"FAQPage",
        "mainEntity":[
          {"@type":"Question","name":"Can I use " + name + " without uploading my file?","acceptedAnswer":{"@type":"Answer","text":summary + " PDF Ultra Pro is designed around browser-side processing, so supported operations do not require a server upload."}},
          {"@type":"Question","name":"Is " + name + " free?","acceptedAnswer":{"@type":"Answer","text":"Yes. PDF Ultra Pro provides the tool without requiring an account or paid subscription."}}
        ]
      });
      addToolGuide(key, name, summary);
    } else if (key === "index") {
      addJSONLD("seo-site-schema", {
        "@context":"https://schema.org",
        "@graph":[
          {"@type":"WebSite","@id":SITE_ROOT+"#website","name":"PDF Ultra Pro","url":SITE_ROOT,"description":"Private PDF tools that run directly in your browser."},
          {"@type":"Organization","@id":SITE_ROOT+"#organization","name":"PDF Ultra Pro","url":SITE_ROOT,"logo":{"@type":"ImageObject","url":SITE_ROOT+"icons/icon-192.svg"}}
        ]
      });
      addJSONLD("seo-home-faq", {
        "@context":"https://schema.org","@type":"FAQPage","mainEntity":[
          {"@type":"Question","name":"Is my file actually uploaded anywhere?","acceptedAnswer":{"@type":"Answer","text":"No. The core PDF tools process supported files in the browser using client-side JavaScript libraries."}},
          {"@type":"Question","name":"Is PDF Ultra Pro really free?","acceptedAnswer":{"@type":"Answer","text":"Yes. The tools are designed to run in the browser without a paid account."}},
          {"@type":"Question","name":"Does this work on mobile?","acceptedAnswer":{"@type":"Answer","text":"Yes. PDF Ultra Pro is designed for modern mobile browsers, although very large PDFs can require more memory."}},
          {"@type":"Question","name":"Why don't Protect PDF and Unlock PDF work yet?","acceptedAnswer":{"@type":"Answer","text":"Reliable password encryption and password removal are not currently available in this browser-only implementation."}}
        ]
      });
    }
  }

  function addToolGuide(key, name, summary) {
    if (document.querySelector(".seo-tool-guide")) return;
    const app = document.getElementById("tool-app");
    if (!app) return;
    const section = document.createElement("section");
    section.className = "section section-tight seo-tool-guide";
    section.innerHTML = `<div class="container narrow prose"><h2>${name}: how it works</h2><p>${summary} ${name} is designed for people who want a fast PDF workflow without sending documents to an online processing server. The page is intended to make the common task simple: choose a document, make the required changes, review the result, and save the finished PDF or output directly to your device.</p><p>For supported operations, processing happens in your browser. Your selected file is read by client-side code and the result is generated locally. This can be useful for private documents such as school records, work documents, forms, contracts, scanned notes, drafts and other files you would rather keep on your own device. Because browser processing depends on the device, very large or complex documents can take longer and may use more memory.</p><h3>How to use ${name}</h3><ol><li>Open this PDF Ultra Pro tool in a modern browser.</li><li>Select or drag your PDF or supported document into the tool.</li><li>Choose the options required for your task and review the document preview when available.</li><li>Run the operation and wait while your browser processes the file.</li><li>Save the resulting file to your device.</li></ol><h3>Why use a browser-based PDF tool?</h3><p>A client-side workflow avoids an unnecessary document-upload step for supported operations. It also means there is no account required for the core tools. PDF Ultra Pro is designed for desktop and mobile browsers and focuses on quick PDF tasks such as organizing pages, converting documents, extracting content, adding annotations and working with scanned files. Tool capabilities vary by document type and browser support, so always review the generated result before using it for important work.</p></div>`;
    const host = app.closest(".container") || app.parentElement;
    host.parentElement.appendChild(section);
  }

  function mount() {
    const headerEl = document.getElementById("site-header");
    const footerEl = document.getElementById("site-footer");
    if (headerEl) headerEl.innerHTML = headerHTML();
    if (footerEl) footerEl.innerHTML = footerHTML();
    const toggle = document.getElementById("nav-toggle");
    const links = document.getElementById("nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", () => { const isOpen = links.classList.toggle("open"); toggle.setAttribute("aria-expanded", String(isOpen)); });
      links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }));
    }
    if (window.PDFUltraTheme) window.PDFUltraTheme.applyTheme(document.documentElement.getAttribute("data-theme"));
    applySEO();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
