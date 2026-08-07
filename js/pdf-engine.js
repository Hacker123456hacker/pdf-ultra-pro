/**
 * pdf-engine.js
 * Shared, security-conscious helpers used by every tool page.
 *
 * All processing happens locally via pdf-lib / pdf.js / jsPDF. No file
 * is ever sent to a server — everything here runs in the browser.
 */
"use strict";

const PDFEngine = (() => {
  // ---- Configuration -------------------------------------------------
  const MAX_FILE_SIZE_MB = 100; // per-file cap to protect memory/perf
  const MAX_FILES = 40; // per-batch cap
  const MAX_TOTAL_PAGES_FOR_THUMBS = 400; // avoid rendering runaway page counts

  const ACCEPT_PDF = ["application/pdf"];
  const ACCEPT_IMAGE = ["image/jpeg", "image/png", "image/webp"];

  let pdfWorkerConfigured = false;

  function configurePdfJsWorker() {
    if (pdfWorkerConfigured || typeof pdfjsLib === "undefined") return;
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    pdfWorkerConfigured = true;
  }

  // ---- Validation ------------------------------------------------------
  /**
   * Validates a File object before it is ever read into memory.
   * Defends against oversized uploads, wrong types, and empty/zero-byte
   * files that could otherwise crash a downstream parser.
   */
  function validateFile(file, { accept = ACCEPT_PDF, maxSizeMB = MAX_FILE_SIZE_MB, extensions = [] } = {}) {
    if (!(file instanceof File)) {
      return { ok: false, reason: "That doesn't look like a valid file." };
    }
    if (file.size === 0) {
      return { ok: false, reason: `"${sanitizeName(file.name)}" is empty (0 bytes).` };
    }
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return { ok: false, reason: `"${sanitizeName(file.name)}" is larger than the ${maxSizeMB}MB limit.` };
    }
    const typeOk = accept.length === 0 || accept.includes(file.type);
    const extOk =
      extensions.length === 0 ||
      extensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    // Browsers don't always set a MIME type correctly, so we accept a
    // match on either the reported type or the file extension.
    if (!typeOk && !extOk) {
      return { ok: false, reason: `"${sanitizeName(file.name)}" isn't a supported file type.` };
    }
    return { ok: true };
  }

  function validateBatch(files, opts = {}) {
    if (files.length === 0) return { ok: false, reason: "Choose at least one file." };
    if (files.length > (opts.maxFiles || MAX_FILES)) {
      return { ok: false, reason: `You can process up to ${opts.maxFiles || MAX_FILES} files at once.` };
    }
    for (const f of files) {
      const r = validateFile(f, opts);
      if (!r.ok) return r;
    }
    return { ok: true };
  }

  /** Strips control characters and clamps length — used only for display. */
  function sanitizeName(name) {
    return String(name || "file")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .slice(0, 120);
  }

  // ---- File IO -----------------------------------------------------
  function readAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Couldn't read "${sanitizeName(file.name)}".`));
      reader.readAsArrayBuffer(file);
    });
  }

  function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Couldn't read "${sanitizeName(file.name)}".`));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Loads a PDF with pdf-lib. Malformed/corrupt files are caught here
   * and turned into a friendly error rather than an unhandled exception.
   */
  async function loadPdfDoc(arrayBuffer) {
    try {
      return await PDFLib.PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
        updateMetadata: false,
      });
    } catch (err) {
      throw new Error(
        "This PDF couldn't be opened. It may be corrupted, password-protected, or not a valid PDF file."
      );
    }
  }

  async function loadPdfJsDoc(arrayBuffer) {
    configurePdfJsWorker();
    try {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      return await loadingTask.promise;
    } catch (err) {
      throw new Error("This PDF couldn't be rendered. It may be corrupted or password-protected.");
    }
  }

  function downloadBlob(blob, filename) {
    // saveAs (FileSaver.js) triggers a normal client-side download —
    // no data is transmitted anywhere.
    saveAs(blob, sanitizeFilename(filename));
  }

  function sanitizeFilename(name) {
    return String(name || "download")
      .replace(/[\u0000-\u001F\u007F/\\?%*:|"<>]/g, "-")
      .slice(0, 150);
  }

  // ---- Page range parsing ---------------------------------------------
  /**
   * Parses a page-range string like "1-3,5,8-10" into a sorted, de-duped,
   * zero-based index array bounded to [0, pageCount). Rejects anything
   * that isn't digits/commas/hyphens/whitespace to avoid pathological
   * input reaching a regex or loop with attacker-controlled size.
   */
  function parsePageRanges(input, pageCount) {
    const str = String(input || "").trim();
    if (!/^[\d,\-\s]*$/.test(str)) {
      throw new Error("Page ranges can only contain numbers, commas and hyphens (e.g. 1-3,5,8-10).");
    }
    if (str === "") throw new Error("Enter at least one page number or range.");

    const indices = new Set();
    const parts = str.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 500) throw new Error("That range list is too long.");

    for (const part of parts) {
      if (part.includes("-")) {
        const [aRaw, bRaw] = part.split("-").map((s) => s.trim());
        const a = parseInt(aRaw, 10);
        const b = parseInt(bRaw, 10);
        if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < 1) {
          throw new Error(`"${part}" isn't a valid range.`);
        }
        const start = Math.min(a, b);
        const end = Math.min(Math.max(a, b), pageCount);
        for (let i = start; i <= end; i++) indices.add(i - 1);
      } else {
        const n = parseInt(part, 10);
        if (!Number.isInteger(n) || n < 1) throw new Error(`"${part}" isn't a valid page number.`);
        if (n <= pageCount) indices.add(n - 1);
      }
    }
    if (indices.size === 0) throw new Error("No valid pages were found in that range for this document.");
    return Array.from(indices).sort((a, b) => a - b);
  }

  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  async function canvasToBlob(canvas, type = "image/jpeg", quality = 0.92) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't export the image."))),
        type,
        quality
      );
    });
  }

  async function renderPageToCanvas(pdfJsDoc, pageNumber, scale = 1) {
    const page = await pdfJsDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas;
  }

  return {
    MAX_FILE_SIZE_MB,
    MAX_FILES,
    MAX_TOTAL_PAGES_FOR_THUMBS,
    ACCEPT_PDF,
    ACCEPT_IMAGE,
    configurePdfJsWorker,
    validateFile,
    validateBatch,
    sanitizeName,
    sanitizeFilename,
    readAsArrayBuffer,
    readAsDataURL,
    loadPdfDoc,
    loadPdfJsDoc,
    downloadBlob,
    parsePageRanges,
    formatBytes,
    canvasToBlob,
    renderPageToCanvas,
  };
})();
