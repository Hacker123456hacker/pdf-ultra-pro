/* Extract Images — embedded-image extraction + image-free PDF
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

  function imageToBlob(img) {
    return new Promise(async (resolve, reject) => {
      try {
        if (img && img.bitmap) {
          const canvas = document.createElement("canvas");
          canvas.width = img.width || img.bitmap.width;
          canvas.height = img.height || img.bitmap.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img.bitmap, 0, 0);
          canvas.toBlob(resolve, "image/png");
          return;
        }

        if (!img || !img.data || !img.width || !img.height) {
          reject(new Error("Unsupported PDF image object"));
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        const src = img.data;
        const rgba = new Uint8ClampedArray(img.width * img.height * 4);

        if (img.kind === 3 || src.length === img.width * img.height * 4) {
          rgba.set(src);
        } else if (img.kind === 2 || src.length === img.width * img.height * 3) {
          for (let i = 0, j = 0; i < src.length; i += 3, j += 4) {
            rgba[j] = src[i];
            rgba[j + 1] = src[i + 1];
            rgba[j + 2] = src[i + 2];
            rgba[j + 3] = 255;
          }
        } else {
          const rowBytes = Math.ceil(img.width / 8);
          let p = 0;
          for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
              const bit = (src[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1;
              const v = bit ? 255 : 0;
              rgba[p++] = v;
              rgba[p++] = v;
              rgba[p++] = v;
              rgba[p++] = 255;
            }
          }
        }

        ctx.putImageData(new ImageData(rgba, img.width, img.height), 0, 0);
        canvas.toBlob(resolve, "image/png");
      } catch (err) {
        reject(err);
      }
    });
  }

  async function extractEmbeddedImages(doc, originalProcess, ws, report) {
    const results = [];
    const seen = new Set();

    if (typeof originalProcess === "function") {
      try {
        const result = await originalProcess(ws, report);
        if (result && Array.isArray(result.downloads) && result.downloads.length) {
          return result.downloads;
        }
      } catch (_) {}
    }

    for (let pageNo = 1; pageNo <= doc.numPages; pageNo++) {
      report(5 + (pageNo / doc.numPages) * 65, `Finding images on page ${pageNo} of ${doc.numPages}…`);
      const page = await doc.getPage(pageNo);
      const opList = await page.getOperatorList();
      const imageFns = new Set([
        pdfjsLib.OPS.paintImageXObject,
        pdfjsLib.OPS.paintJpegXObject,
        pdfjsLib.OPS.paintImageMaskXObject
      ]);

      for (let i = 0; i < opList.fnArray.length; i++) {
        if (!imageFns.has(opList.fnArray[i])) continue;
        const args = opList.argsArray[i] || [];
        const objId = args[0];
        if (!objId || seen.has(objId)) continue;
        seen.add(objId);

        const img = page.objs.get(objId);
        if (!img) continue;

        try {
          const blob = await imageToBlob(img);
          if (!blob) continue;
          results.push({
            blob,
            filename: `image-${String(results.length + 1).padStart(3, "0")}.png`
          });
        } catch (_) {}
      }
    }

    return results;
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

    cfg.desc = "Extract actual embedded images separately, download all images as a ZIP, and create a text-only PDF without embedded images when possible.";

    cfg.process = async function (ws, report) {
      report(3, "Reading PDF…");
      const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
      const doc = await PDFEngine.loadPdfJsDoc(buf);
      const images = await extractEmbeddedImages(doc, cfg._originalExtractImagesProcess, ws, report);

      // Images are optional. We still create the image-free PDF when the source
      // PDF contains selectable text, even if no embedded images were found.
      let textOnlyPdf = null;
      try {
        report(75, "Creating image-free PDF…");
        textOnlyPdf = await buildTextOnlyPdf(doc, report);
      } catch (_) {}

      if (!images.length && !textOnlyPdf) {
        throw new Error("No embedded images were found, and this PDF contains no selectable text from which an image-free PDF can be created.");
      }

      const downloads = [];
      if (images.length) {
        report(90, "Packaging images…");
        const zip = await downloadsAsZipOrSequence(
          images,
          renameFile(ws.files[0].name, "extracted-images", "zip")
        );
        downloads.push(...images, ...zip);
      }

      if (textOnlyPdf) {
        downloads.push({
          blob: textOnlyPdf,
          filename: renameFile(ws.files[0].name, "without-images", "pdf")
        });
      }

      return {
        message: images.length
          ? `Found ${images.length} embedded image${images.length === 1 ? "" : "s"}. You can download each image separately, download all images as a ZIP, and download a PDF without embedded images.`
          : "No embedded images were found. A PDF without images was created from the selectable text.",
        downloads
      };
    };
  }

  install();
})();
