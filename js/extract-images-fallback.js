/* Extract Images compatibility + image-free PDF export
 * Everything stays local in the browser.
 */
"use strict";

(function () {
  async function buildTextOnlyPdf(pdfJsDoc, report) {
    if (!window.jspdf || !window.jspdf.jsPDF) return null;

    const JsPDF = window.jspdf.jsPDF;
    const out = new JsPDF({ unit: "pt", compress: true });
    let hasText = false;

    for (let i = 1; i <= pdfJsDoc.numPages; i++) {
      const page = await pdfJsDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      if (i > 1) out.addPage([viewport.width, viewport.height]);
      else {
        // Replace the default first page with the source page dimensions.
        out.deletePage(1);
        out.addPage([viewport.width, viewport.height]);
      }

      const textContent = await page.getTextContent();
      for (const item of textContent.items || []) {
        if (!item || typeof item.str !== "string" || !item.str.trim()) continue;
        const t = item.transform || [1, 0, 0, 1, 0, 0];
        const x = Number(t[4]) || 0;
        const y = viewport.height - (Number(t[5]) || 0);
        const size = Math.max(4, Math.min(96, Math.sqrt((t[0] || 1) ** 2 + (t[1] || 0) ** 2)));
        out.setFont("helvetica", "normal");
        out.setFontSize(size);
        out.text(item.str, x, y, { baseline: "alphabetic" });
        hasText = true;
      }
      report(70 + (i / pdfJsDoc.numPages) * 20, `Creating image-free PDF page ${i} of ${pdfJsDoc.numPages}…`);
    }

    if (!hasText) return null;
    return new Blob([out.output("arraybuffer")], { type: "application/pdf" });
  }

  async function extractImagesAndFallback(ws, report, originalProcess) {
    let imageDownloads = [];

    if (typeof originalProcess === "function") {
      try {
        const result = await originalProcess(ws, report);
        if (result && Array.isArray(result.downloads) && result.downloads.length) {
          imageDownloads = result.downloads;
        }
      } catch (_) {
        // If embedded-image extraction fails, render PDF pages below.
      }
    }

    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    const doc = await PDFEngine.loadPdfJsDoc(buf);

    // If no embedded images were extracted, export each page as JPG.
    if (!imageDownloads.length) {
      for (let i = 1; i <= doc.numPages; i++) {
        report(5 + (i / doc.numPages) * 55, `Rendering page ${i} of ${doc.numPages}…`);
        const canvas = await PDFEngine.renderPageToCanvas(doc, i, 1.75);
        const blob = await PDFEngine.canvasToBlob(canvas, "image/jpeg", 0.94);
        imageDownloads.push({
          blob,
          filename: renameFile(ws.files[0].name, `page-${i}`, "jpg"),
        });
      }
    }

    if (!imageDownloads.length) {
      throw new Error("This PDF has no pages that can be exported as images.");
    }

    // Add a ZIP containing all extracted/rendered images.
    const zipDownloads = await downloadsAsZipOrSequence(
      imageDownloads,
      renameFile(ws.files[0].name, "images", "zip")
    );

    report(72, "Creating image-free PDF…");
    const textOnlyPdf = await buildTextOnlyPdf(doc, report);

    const downloads = [...imageDownloads, ...zipDownloads];
    if (textOnlyPdf) {
      downloads.push({
        blob: textOnlyPdf,
        filename: renameFile(ws.files[0].name, "without-images", "pdf"),
      });
    }

    return {
      message: textOnlyPdf
        ? `Extracted ${imageDownloads.length} image${imageDownloads.length === 1 ? "" : "s"}. Individual images, a ZIP, and an image-free text PDF are ready. All processing was local.`
        : `Extracted ${imageDownloads.length} image${imageDownloads.length === 1 ? "" : "s"}. Individual images and a ZIP are ready. This PDF contains no selectable text, so an image-free text PDF could not be created.` ,
      downloads,
    };
  }

  function install() {
    if (typeof TOOL_CONFIGS === "undefined" || !TOOL_CONFIGS["extract-images"]) {
      setTimeout(install, 25);
      return;
    }

    const cfg = TOOL_CONFIGS["extract-images"];
    if (!cfg._originalExtractImagesProcess && typeof cfg.process === "function") {
      cfg._originalExtractImagesProcess = cfg.process;
    }

    cfg.desc = "Extract every image separately, download all images as a ZIP, and create a text-only PDF without embedded images when possible.";
    cfg.process = function (ws, report) {
      return extractImagesAndFallback(ws, report, cfg._originalExtractImagesProcess);
    };
  }

  install();
})();
