/*
 * PDF Ultra Pro - OCR compatibility fix
 *
 * Tesseract.js v5 runs OCR inside a WebWorker. On some mobile browsers,
 * relying on the default worker/blob loading path can fail. We explicitly
 * provide the v5 worker, core directory, and language-data paths.
 *
 * This file is loaded BEFORE js/tools.js, so the wrapper is installed before
 * the OCR tool calls Tesseract.createWorker().
 */
"use strict";

(function () {
  const install = () => {
    if (!window.Tesseract || typeof window.Tesseract.createWorker !== "function") {
      return false;
    }
    if (window.__pdfUltraOcrPatched) return true;

    const originalCreateWorker = window.Tesseract.createWorker.bind(window.Tesseract);
    const VERSION = "5.1.1";

    window.Tesseract.createWorker = function (langs, oem, options) {
      const opts = Object.assign({}, options || {});

      // Explicit v5 paths. corePath MUST be a directory, not a single wasm.js file.
      if (!opts.workerPath) {
        opts.workerPath = `https://cdn.jsdelivr.net/npm/tesseract.js@${VERSION}/dist/worker.min.js`;
      }
      if (!opts.corePath) {
        opts.corePath = `https://cdn.jsdelivr.net/npm/tesseract.js-core@${VERSION}`;
      }
      if (!opts.langPath) {
        opts.langPath = "https://tessdata.projectnaptha.com/4.0.0";
      }

      // Avoid Blob-worker creation where mobile Chrome/WebView policies can interfere.
      opts.workerBlobURL = false;

      const previousErrorHandler = opts.errorHandler;
      opts.errorHandler = (err) => {
        console.error("[PDF Ultra Pro OCR worker]", err);
        if (typeof previousErrorHandler === "function") previousErrorHandler(err);
      };

      console.info("[PDF Ultra Pro OCR] starting", {
        language: langs,
        workerPath: opts.workerPath,
        corePath: opts.corePath,
        langPath: opts.langPath,
      });

      return originalCreateWorker(langs, oem, opts);
    };

    window.__pdfUltraOcrPatched = true;
    return true;
  };

  if (!install()) {
    window.addEventListener("load", install, { once: true });
  }
})();
