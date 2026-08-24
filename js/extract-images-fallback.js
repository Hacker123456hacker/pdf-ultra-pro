/* Extract Images — embedded-image extraction only
 * Never treats whole PDF pages as "images".
 * Everything stays local in the browser.
 */
"use strict";

(function () {
  function imageToBlob(img) {
    return new Promise(async (resolve, reject) => {
      try {
        // PDF.js may expose an ImageBitmap for decoded PDF images.
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

        // PDF.js ImageKind values: 1 = 1bpp gray, 2 = RGB, 3 = RGBA.
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
          // Handle 1-bit grayscale masks.
          let p = 0;
          const rowBytes = Math.ceil(img.width / 8);
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

    // First use the existing extractor if it can return real embedded images.
    if (typeof originalProcess === "function") {
      try {
        const result = await originalProcess(ws, report);
        if (result && Array.isArray(result.downloads) && result.downloads.length) {
          return result.downloads;
        }
      } catch (_) {}
    }

    // PDF.js operator-list extraction. This gets the actual image objects
    // used by the PDF, not screenshots of complete pages.
    for (let pageNo = 1; pageNo <= doc.numPages; pageNo++) {
      report(5 + (pageNo / doc.numPages) * 80, `Finding images on page ${pageNo} of ${doc.numPages}…`);
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
        } catch (_) {
          // Ignore unsupported/mask-only image objects and continue.
        }
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

    cfg.desc = "Extract only the actual embedded images from a PDF. Download each image separately or download them all as a ZIP.";

    cfg.process = async function (ws, report) {
      report(3, "Reading PDF…");
      const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
      const doc = await PDFEngine.loadPdfJsDoc(buf);
      const images = await extractEmbeddedImages(doc, cfg._originalExtractImagesProcess, ws, report);

      if (!images.length) {
        throw new Error("No embedded images were found in this PDF. This tool does not convert whole PDF pages into JPG files.");
      }

      report(90, "Packaging images…");
      const zip = await downloadsAsZipOrSequence(
        images,
        renameFile(ws.files[0].name, "extracted-images", "zip")
      );

      return {
        message: `Found ${images.length} embedded image${images.length === 1 ? "" : "s"}. You can download each image separately or download all images as a ZIP.`,
        downloads: [...images, ...zip]
      };
    };
  }

  install();
})();
