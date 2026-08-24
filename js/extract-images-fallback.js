/* Extract Images fallback
 * If a PDF has no separately embedded image objects (common with scanned PDFs),
 * export each rendered PDF page as a JPG instead of showing a hard failure.
 */
"use strict";

(function () {
  const cfg = TOOL_CONFIGS["extract-images"];
  if (!cfg || typeof cfg.process !== "function") return;

  const originalProcess = cfg.process;

  cfg.desc = "Extract embedded images from a PDF; if none are embedded, export each page as a JPG.";

  cfg.process = async function (ws, report) {
    try {
      return await originalProcess(ws, report);
    } catch (error) {
      const message = error && error.message ? error.message : String(error || "");
      if (!/No embedded images were found/i.test(message)) throw error;

      report(5, "No embedded images found — rendering PDF pages instead…");

      const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
      const pdfJsDoc = await PDFEngine.loadPdfJsDoc(buf);
      const outputs = [];

      for (let i = 1; i <= pdfJsDoc.numPages; i++) {
        report(5 + (i / pdfJsDoc.numPages) * 80, `Rendering page ${i} of ${pdfJsDoc.numPages}…`);
        const canvas = await PDFEngine.renderPageToCanvas(pdfJsDoc, i, 1.5);
        const blob = await PDFEngine.canvasToBlob(canvas, "image/jpeg", 0.92);
        outputs.push({
          blob,
          filename: renameFile(ws.files[0].name, `page-${i}`, "jpg"),
        });
      }

      if (!outputs.length) {
        throw new Error("This PDF has no pages that can be rendered as images.");
      }

      report(90, "Packaging…");
      const downloads = await downloadsAsZipOrSequence(
        outputs,
        renameFile(ws.files[0].name, "pages", "zip")
      );

      return {
        message: `No embedded image objects were found, so ${outputs.length} PDF page${outputs.length > 1 ? "s" : ""} were exported as JPG images.`,
        downloads,
      };
    }
  };
})();
