# Security notes

This project is a static site (no backend), which limits some server-level protections. Here's what's in place and what to add depending on where you host it.

## Implemented in code

- **No `eval()`** anywhere in the codebase.
- **No `innerHTML` with user/file-derived data.** File names, extracted PDF text, and PDF metadata are always rendered with `textContent` or direct property assignment (see `js/tools.js` and `js/pdf-engine.js`). The only `innerHTML` assignments in the codebase are constant, developer-authored markup (icons, header/footer chrome, static UI strings) — grep for `.innerHTML` to audit this yourself.
- **Strict mode** (`"use strict"`) in every script file.
- **Input validation** on every file upload: type, extension, size (100MB/file) and batch count (40 files) checks in `PDFEngine.validateFile` / `validateBatch` before any file is read into memory.
- **Page-range parsing** (`PDFEngine.parsePageRanges`) uses an allow-list regex (`^[\d,\-\s]*$`) before any further processing, and caps the number of range groups, to avoid pathological input.
- **Graceful error handling.** Corrupted/malformed/encrypted PDFs are caught and converted into a plain-language message; no stack traces or internal errors are ever shown in the UI.
- **No prototype-pollution surface**: this app doesn't do recursive object merges of untrusted JSON, and doesn't use libraries known for prototype-pollution CVEs in this configuration.

## Requires host-level configuration

Static hosts can't set response headers from HTML alone. This repo includes a `_headers` file using the format understood by **Netlify** and **Cloudflare Pages**, which sets:

- `X-Frame-Options: DENY` — prevents this site being embedded in a clickjacking iframe.
- `Content-Security-Policy` — restricts scripts to `'self'` and the CDN this project loads libraries from, restricts framing (`frame-ancestors 'none'`), and restricts form submission targets.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a conservative `Permissions-Policy`.

**GitHub Pages does not support custom response headers**, so `_headers` will be ignored there. If you deploy to GitHub Pages, put the site behind a CDN/proxy (e.g. Cloudflare's free tier in front of your `github.io` domain) and configure the same headers there, or switch to a host that reads `_headers` natively.

## CDN dependency

This project loads pdf-lib, pdf.js, jsPDF, SortableJS, FileSaver.js and JSZip from `cdnjs.cloudflare.com`, and fonts from `fonts.googleapis.com` / `fonts.gstatic.com`, per the CSP above. If you need a stricter policy with no third-party origins at all, see `libs/README.md` for instructions on self-hosting these libraries.
