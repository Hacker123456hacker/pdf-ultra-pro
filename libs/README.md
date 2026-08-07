# libs/

This project loads all third-party JavaScript (pdf-lib, pdf.js, jsPDF, SortableJS, FileSaver.js, JSZip) from a public CDN, as required by the project spec — see the `<script src="https://cdnjs.cloudflare.com/...">` tags at the bottom of each HTML page.

This folder is kept as a placeholder in case you'd rather self-host those libraries (e.g. for stricter Content-Security-Policy control or offline builds without a CDN dependency). To self-host:

1. Download the specific versions referenced in each HTML file's `<script>` tags.
2. Place them here, e.g. `libs/pdf-lib.min.js`.
3. Replace each CDN `<script src="https://...">` tag with a local `<script src="/libs/pdf-lib.min.js">` tag across every HTML page.
4. Update the `Content-Security-Policy` `script-src` directive (see `assets/security-headers.md`) to remove the CDN origin once nothing loads from it.
