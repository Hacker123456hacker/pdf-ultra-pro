/* OCR runtime configuration for Tesseract.js 5.1.1.
 * Uses explicit CDN assets so the browser worker/WASM/model URLs are deterministic.
 */
"use strict";

(function () {
  if (!window.Tesseract || typeof window.Tesseract.createWorker !== "function") return;

  const OCR_WORKER_PATH = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js";
  const OCR_CORE_PATH = "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd-lstm.wasm.js";
  const OCR_LANG_PATH = "https://tessdata.projectnaptha.com/4.0.0";

  const originalCreateWorker = window.Tesseract.createWorker.bind(window.Tesseract);

  window.Tesseract.createWorker = function (lang, oem, options, config) {
    const safeOptions = Object.assign({}, options || {}, {
      workerPath: OCR_WORKER_PATH,
      corePath: OCR_CORE_PATH,
      langPath: OCR_LANG_PATH,
      workerBlobURL: false,
    });

    return originalCreateWorker(lang || "eng", oem == null ? 1 : oem, safeOptions, config);
  };
})();
