/* OCR runtime configuration for Tesseract.js 5.1.1. */
"use strict";

(function () {
  if (!window.Tesseract || typeof window.Tesseract.createWorker !== "function") return;

  // Tesseract v5 expects corePath to be a DIRECTORY containing all core builds.
  // Use unpkg as a fallback CDN for browser worker/WASM assets.
  const OCR_WORKER_PATH = "https://unpkg.com/tesseract.js@5.1.1/dist/worker.min.js";
  const OCR_CORE_PATH = "https://unpkg.com/tesseract.js-core@5.1.1/";
  const OCR_LANG_PATH = "https://tessdata.projectnaptha.com/4.0.0";

  const originalCreateWorker = window.Tesseract.createWorker.bind(window.Tesseract);

  window.Tesseract.createWorker = function (lang, oem, options, config) {
    const safeOptions = Object.assign({}, options || {}, {
      workerPath: OCR_WORKER_PATH,
      corePath: OCR_CORE_PATH,
      langPath: OCR_LANG_PATH,
      workerBlobURL: false,
      gzip: true,
      errorHandler: function (err) {
        console.error("PDF Ultra Pro OCR worker error:", err);
        if (options && typeof options.errorHandler === "function") options.errorHandler(err);
      },
    });

    return originalCreateWorker(lang || "eng", oem == null ? 1 : oem, safeOptions, config);
  };
})();
