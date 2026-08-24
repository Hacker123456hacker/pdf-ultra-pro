/* Extract Images compatibility fallback
 * Some PDFs (especially scanned/generated PDFs) contain image data that
 * PDF.js does not expose through the simple paintImageXObject path.
 * This implementation never leaves the user with the misleading
 * "No embedded images were found" error: if direct extraction does not
 * produce an image, the PDF page itself is rendered to a JPG locally.
 */
"use strict";

(function () {
  function install() {
    if (typeof TOOL_CONFIGS === "undefined" || !TOOL_CONFIGS["extract-images"]) {
      setTimeout(install, 25);
      return;
    }

    const cfg = TOOL_CONFIGS["extract-images"];

    // Preserve an existing implementation only once. This lets us use it
    // when it succeeds, while still guaranteeing a page-render fallback.
    if (!cfg._originalExtractImagesProcess && typeof cfg.process === "function") {
      cfg._originalExtractImagesProcess = cfg.process;
    }

    cfg.desc = "Extract images from a PDF. If the PDF format does not expose separate embedded images, export each page as a JPG.";

    cfg.process = async function (ws, report) {
      report(3, "Reading PDF…");

      if (typeof cfg._originalExtractImagesProcess === "function") {
        try {
          const result = await cfg._originalExtractImagesProcess(ws, report);
          if (result && Array.isArray(result.downloads) && result.downloads.length) {
            return result;
          }
        } catch (_) {
          // Fall through to page rendering.
        }
      }

      const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
      const doc = await PDFEngine.loadPdfJsDoc(buf);
      const outputs = [];

      for (let i = 1; i <= doc.numPages; i++) {
        report(5 + (i / doc.numPages) * 85, `Rendering page ${i} of ${doc.numPages}…`);
        const canvas = await PDFEngine.renderPageToCanvas(doc, i, 1.75);
        const blob = await PDFEngine.canvasToBlob(canvas, "image/jpeg", 0.94);
        outputs.push({
          blob,
          filename: renameFile(ws.files[0].name, `page-${i}`, "jpg"),
        });
      }

      if (!outputs.length) {
        throw new Error("This PDF has no pages that can be exported as images.");
      }

      report(94, "Packaging images…");
      const downloads = await downloadsAsZipOrSequence(
        outputs,
        renameFile(ws.files[0].name, "images", "zip")
      );

      return {
        message: `Exported ${outputs.length} PDF page${outputs.length === 1 ? "" : "s"} as JPG image${outputs.length === 1 ? "" : "s"}. Everything was processed locally in your browser.`,
        downloads,
      };
    };
  }

  install();
})();
