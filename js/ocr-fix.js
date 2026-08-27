/* OCR runtime fix for Tesseract.js 5.x.
 * Keeps the main tools.js untouched and gives OCR explicit CDN paths.
 */
"use strict";

(function () {
  const OCR_WORKER_PATH = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js";
  const OCR_CORE_PATH = "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1";
  const OCR_LANG_PATH = "https://tessdata.projectnaptha.com/4.0.0";

  const originalCreateWorker = window.Tesseract && window.Tesseract.createWorker;
  if (!originalCreateWorker || !window.Tesseract) return;

  window.PDFUltraProCreateOCRWorker = function (lang, logger) {
    return originalCreateWorker.call(window.Tesseract, lang, 1, {
      workerPath: OCR_WORKER_PATH,
      corePath: OCR_CORE_PATH,
      langPath: OCR_LANG_PATH,
      logger: logger || undefined,
    });
  };
})();
