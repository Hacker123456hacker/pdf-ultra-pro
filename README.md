# PDF Ultra Pro

A free, production-ready PDF toolkit that runs **entirely in the browser** — no backend, no Python, no PHP, no Node.js server. Every tool uses client-side JavaScript (pdf-lib, pdf.js, jsPDF, SortableJS, FileSaver.js, JSZip, all loaded from CDN) to read, edit and write PDF files locally on the user's device.

## What's actually implemented

24 tools are fully functional end-to-end:

| Category | Tools |
|---|---|
| Organize | Merge PDF, Split PDF, Rotate PDF, Delete Pages, Extract Pages, Reorder Pages |
| Edit | Crop PDF, Watermark PDF, Add Page Numbers, PDF Metadata, Sign PDF, Extract Fonts |
| Optimize | Compress PDF, Repair PDF |
| Convert | PDF to JPG, JPG/PNG to PDF, PDF to Text, Extract Images, Word to PDF, Excel to PDF, PowerPoint to PDF, OCR PDF |
| View | Preview PDF, Compare PDFs |

**Word to PDF** (mammoth.js + jsPDF/html2canvas), **Excel to PDF** (SheetJS), and **PowerPoint to PDF** (JSZip-based text extraction) work but are honest about fidelity: they reproduce content, not pixel-perfect original layout — each tool's page states this plainly before you convert. **OCR PDF** runs a real on-device OCR engine (Tesseract.js, 8 languages) and adds an invisible, selectable text layer over the original scanned image. **Extract Fonts** is best-effort — it only recovers standard embedded TrueType/OpenType/Type1 font files.

**Protect PDF** and **Unlock PDF** are intentionally *not* implemented as working tools. Real PDF encryption/decryption needs a properly vetted crypto implementation; the client-side library this project uses (pdf-lib) doesn't support it, and hand-rolling encryption code risks producing a file that looks protected but isn't — worse than no protection at all. Both have dedicated pages (`protect-pdf.html`, `unlock-pdf.html`) explaining this and linking to real alternatives (Adobe Acrobat, LibreOffice, qpdf) rather than a fake "coming soon" placeholder. See `faq.html` for more.

## Folder structure

```
/index.html            Home page
/all-tools.html         Full tool directory with search + category filter
/about.html /faq.html /contact.html /blog.html
/privacy.html /terms.html /disclaimer.html
/404.html               Custom error page
/merge-pdf.html ...     One page per tool (19 total)
/css/style.css          Full design system (light + dark theme)
/js/
  theme.js              Dark/light mode toggle
  partials.js           Injects shared header/nav + footer
  pdf-engine.js         File validation, PDF/pdf.js loading, helpers
  tools.js              Tool registry + generic workspace UI + all tool logic
  main.js               Homepage search/filter, contact form, SW registration
/icons/                 favicon + app icons (SVG)
/images/                Open Graph share image (SVG)
/manifest.json          PWA manifest
/sw.js                  Minimal offline service worker (same-origin shell only)
/robots.txt
/sitemap.xml
```

## Path structure — works at any subpath

All internal links, scripts and asset references use **relative paths** (`css/style.css`, `merge-pdf.html`, etc.) instead of root-relative paths (`/css/style.css`). This means the site works correctly both:
- at a domain root (e.g. `https://pdfultrapro.com/`), and
- at a GitHub Pages **project** subpath (e.g. `https://yourusername.github.io/pdf-ultra-pro/`) — the common case when you haven't set up a custom domain or a user/organization Pages site.

If you fork/copy this project and add new pages, keep using relative paths (no leading `/`) for anything internal — `js/tools.js`, `about.html`, `icons/favicon.svg` — not `/js/tools.js`. Only `canonical`/`og:url` tags should stay as full `https://...` URLs, and even those need updating to your real domain (see below).

## Running it locally

No build step. Because the site uses `fetch`/`serviceWorker`, serve it over HTTP rather than opening files directly with `file://`:

```bash
cd pdf-ultra-pro
python3 -m http.server 8080
# visit http://localhost:8080/index.html
```

## Deploying to GitHub Pages

1. Create a new GitHub repository and push this folder's contents to the `main` branch (the repo root should contain `index.html`, not a subfolder).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Under **Branch**, choose `main` and `/ (root)`, then click **Save**.
5. Wait 1–2 minutes for the first build (check the **Actions** tab for the "pages build and deployment" workflow — if it's still running, that's why the site isn't live yet). Once it finishes, GitHub shows the live URL at the top of the Pages settings page: `https://<your-username>.github.io/<repo-name>/`.
6. If you see **"There isn't a GitHub Pages site here"**: it almost always means step 3–4 hasn't been completed/saved yet, or the branch you pushed to doesn't match what's selected in Pages settings, or the first deployment is still in progress. Re-check Settings → Pages and the Actions tab.
7. Update the canonical URLs in each page's `<head>` (currently `https://pdfultrapro.example.com/...`) and the URLs in `robots.txt` / `sitemap.xml` to your real published URL, e.g. `https://yourusername.github.io/pdf-ultra-pro/`.

## Submitting to Google Search Console

1. Go to [search.google.com/search-console](https://search.google.com/search-console) and add your site as a property (Domain or URL-prefix).
2. Verify ownership using one of Search Console's methods (DNS record, HTML file upload, or the meta tag method — add the tag to every page's `<head>` if you use it).
3. Once verified, open **Sitemaps** in the left nav and submit `sitemap.xml` (e.g. `https://yourdomain.com/sitemap.xml`).
4. Use **URL Inspection** to request indexing for `index.html` and a few key tool pages.

## Adding Google AdSense

1. Sign up at [adsense.google.com](https://adsense.google.com) and get your site approved.
2. Add your AdSense loader script to the `<head>` of each page (or, more maintainably, add it inside `js/partials.js`'s header injection so it's centralized):
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
   ```
3. Replace the placeholder `<div class="ad-slot">` elements (in `index.html`, `all-tools.html`, and each tool page) with real `<ins class="adsbygoogle">` ad units per AdSense's instructions.
4. Update `privacy.html` to disclose the ad network once it's live — the current copy notes this is a placeholder.

## Using a custom domain

**On GitHub Pages:**
1. In **Settings → Pages → Custom domain**, enter your domain (e.g. `pdfultrapro.com`) and save — this creates a `CNAME` file in the repo automatically.
2. At your domain registrar, add a `CNAME` record pointing `www` (or an `A`/`ALIAS` record for the apex domain) to `<your-username>.github.io`, following [GitHub's current DNS instructions](https://docs.github.com/pages).
3. Wait for DNS to propagate, then enable **Enforce HTTPS** in the same Pages settings panel.
4. Update `robots.txt`, `sitemap.xml`, and the canonical/OG URLs across the HTML files to the new domain.

## Extending the toolkit

Every implemented tool is a small object passed to `registerTool()` in `js/tools.js`, with a `process(workspace, report)` function that returns `{ message, downloads }`. To add a new tool:

1. Add a `registerTool({...})` entry in `js/tools.js` (copy a similar existing tool as a starting point).
2. Generate a matching HTML page (copy any existing `*-pdf.html` file and update the `<title>`, meta tags, `<h1>`, and `data-tool` attribute on `<body>` to your new tool's id).
3. Add it to the tool list arrays used by `index.html` / `all-tools.html`, and to `sitemap.xml`.

Security-relevant conventions used throughout the codebase — worth keeping if you extend it:
- File names and any text extracted from a user's PDF (metadata, extracted text) are rendered with `textContent`/property assignment, never `innerHTML`.
- All file uploads go through `PDFEngine.validateFile` / `validateBatch` (type, size, and count checks) before being read.
- Page-range input is parsed with a strict allow-list regex before use.
- The only `innerHTML` usage in the JS is for constant, developer-authored markup (icons, header/footer chrome) — never for anything derived from a file the user opened.

## Additional CDN libraries used by the newer tools

Beyond the original spec's library list, these tools load one more focused CDN library each (all open-source, MIT/Apache licensed):

- **Word to PDF** — [mammoth.js](https://github.com/mwilliamson/mammoth.js) (docx → HTML) + [html2canvas](https://github.com/niklasvh/html2canvas) (HTML → PDF via jsPDF's `.html()`)
- **Excel to PDF** — [SheetJS (xlsx)](https://sheetjs.com/) + html2canvas
- **OCR PDF** — [Tesseract.js](https://github.com/naptha/tesseract.js) (WASM OCR engine; downloads a small language model to the browser on first use per language)
- **PowerPoint to PDF** and **Extract Fonts** need no additional libraries beyond what's already loaded (JSZip and pdf-lib respectively).

## Browser support

Tested against current versions of Chrome, Firefox, Edge and Safari (desktop and mobile). The interface is responsive down to small phone widths, respects `prefers-reduced-motion`, and keeps visible focus outlines for keyboard navigation.

## License note

This project's own HTML/CSS/JS is provided for you to use and modify freely. The bundled third-party libraries (pdf-lib, pdf.js, jsPDF, SortableJS, FileSaver.js, JSZip) are loaded from CDN and remain under their own respective open-source licenses — check each project's license before commercial redistribution.
