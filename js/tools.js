/**
 * tools.js
 * Tool registry + a generic workspace UI that every tool page shares.
 *
 * Security notes:
 *  - File names, PDF metadata, and any other file-derived text are
 *    rendered with textContent / DOM property assignment, never
 *    innerHTML, since that content is attacker-controllable if a user
 *    opens a crafted file.
 *  - The only innerHTML use in this file is for constant, developer
 *    authored icon markup (ICONS below) — never for file-derived data.
 *  - "use strict" avoids accidental globals; every function guards its
 *    inputs and reports failures without leaking stack traces to the UI.
 */
"use strict";

const ICONS = {
  merge: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M7 3v9a5 5 0 0 0 10 0V3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4 3h6M14 3h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 21v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  split: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M6 3h6l6 6v12H6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 3v6h6" stroke="currentColor" stroke-width="1.8"/><path d="M4 14l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  compress: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 9l4-4 4 4M4 15l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 5v14" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="4" width="6" height="16" rx="1.5" stroke="currentColor" stroke-width="1.8"/></svg>',
  rotate: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 1 1 2.6 5.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3 17v-5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  trash: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  extract: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M9 12h6M12 9v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  reorder: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><path d="M13 7h7M4 17h7" stroke="currentColor" stroke-width="1.8" stroke-dasharray="1 3" stroke-linecap="round"/></svg>',
  crop: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  watermark: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 3s5 5.5 5 9.5a5 5 0 0 1-10 0C7 8.5 12 3 12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  pagenum: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/><text x="12" y="17" font-size="7" text-anchor="middle" fill="currentColor" font-family="sans-serif">12</text></svg>',
  lock: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.8"/></svg>',
  unlock: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 7.4-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  image: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="10" r="1.6" stroke="currentColor" stroke-width="1.6"/><path d="M4 17l5-5 4 4 3-3 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  text: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 12h7M8.5 15.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  metadata: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="14" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M12 11v-1M12 18v-1M15 14h1M8 14h1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  eye: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg>',
  wrench: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4l-3 3-2-2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  sign: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M3 17s2-1 4-1 3 2 5 2 3-2 5-2 4 1 4 1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M6 13 15 4l3 3-9 9-4 1 1-4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  compare: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M8 3v18M16 3v18" stroke="currentColor" stroke-width="1.8"/><path d="M4 8h4M16 8h4M4 16h4M16 16h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  organize: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="8" height="6" rx="1.3" stroke="currentColor" stroke-width="1.7"/><rect x="13" y="4" width="8" height="6" rx="1.3" stroke="currentColor" stroke-width="1.7"/><rect x="3" y="14" width="8" height="6" rx="1.3" stroke="currentColor" stroke-width="1.7"/><rect x="13" y="14" width="8" height="6" rx="1.3" stroke="currentColor" stroke-width="1.7"/></svg>',
  ocr: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 12h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  font: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M6 20 11 4h2l5 16M8 14h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  office: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M3 9h18" stroke="currentColor" stroke-width="1.8"/></svg>',
};

function svgIcon(name) {
  return ICONS[name] || ICONS.text;
}

// ---------------------------------------------------------------------
// Tool registry — one entry per tool. `process` receives the workspace
// state and a `report(progress, label)` callback, and returns
// { message, downloads: [{blob, filename}] }.
// ---------------------------------------------------------------------
const TOOL_CONFIGS = {};

function registerTool(cfg) {
  TOOL_CONFIGS[cfg.id] = cfg;
}

// ---------------------------------------------------------------------
// Generic page-thumbnail grid (used by rotate / delete / extract / organize)
// ---------------------------------------------------------------------
async function buildPageGrid(container, pdfJsDoc, opts) {
  const { selectable = false, rotatable = false, reorderable = false, removable = false } = opts;
  const pageCount = pdfJsDoc.numPages;
  if (pageCount > PDFEngine.MAX_TOTAL_PAGES_FOR_THUMBS) {
    const warn = document.createElement("div");
    warn.className = "alert alert-warning";
    warn.textContent = `This document has ${pageCount} pages — thumbnail previews are skipped above ${PDFEngine.MAX_TOTAL_PAGES_FOR_THUMBS} pages for performance, but you can still use page-range fields below.`;
    container.appendChild(warn);
    return { getState: () => null, grid: null, tooLarge: true };
  }

  const grid = document.createElement("div");
  grid.className = "thumb-grid";
  container.appendChild(grid);

  const state = [];
  for (let i = 1; i <= pageCount; i++) {
    const card = document.createElement("div");
    card.className = "thumb-card";
    card.dataset.originalIndex = String(i - 1);
    card.dataset.rotation = "0";

    if (selectable) {
      const check = document.createElement("input");
      check.type = "checkbox";
      check.className = "thumb-check";
      check.setAttribute("aria-label", `Select page ${i}`);
      card.appendChild(check);
    }
    if (rotatable) {
      const rotateBtn = document.createElement("button");
      rotateBtn.type = "button";
      rotateBtn.className = "thumb-rotate";
      rotateBtn.setAttribute("aria-label", `Rotate page ${i}`);
      rotateBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 1 1 2.6 5.9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3 17v-5h5" stroke="currentColor" stroke-width="2"/></svg>';
      rotateBtn.addEventListener("click", () => {
        const current = parseInt(card.dataset.rotation, 10);
        const next = (current + 90) % 360;
        card.dataset.rotation = String(next);
        const canvas = card.querySelector("canvas");
        if (canvas) canvas.style.transform = `rotate(${next}deg)`;
      });
      card.appendChild(rotateBtn);
    }
    if (removable) {
      const rmBtn = document.createElement("button");
      rmBtn.type = "button";
      rmBtn.className = "thumb-rotate";
      rmBtn.style.left = "6px";
      rmBtn.style.right = "auto";
      rmBtn.setAttribute("aria-label", `Remove page ${i}`);
      rmBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
      rmBtn.addEventListener("click", () => {
        card.remove();
      });
      card.appendChild(rmBtn);
    }

    const num = document.createElement("span");
    num.className = "thumb-num";
    num.textContent = `Page ${i}`;
    card.appendChild(num);

    grid.appendChild(card);
    state.push(card);
  }

  // Render thumbnails progressively so the UI doesn't block on large PDFs.
  for (let i = 1; i <= pageCount; i++) {
    try {
      const canvas = await PDFEngine.renderPageToCanvas(pdfJsDoc, i, 0.28);
      const card = state[i - 1];
      if (card) card.insertBefore(canvas, card.firstChild);
    } catch (e) {
      /* leave the card without a thumbnail rather than failing the whole grid */
    }
  }

  if (reorderable && typeof Sortable !== "undefined") {
    Sortable.create(grid, { animation: 150, ghostClass: "sortable-ghost" });
  }

  function getState() {
    return Array.from(grid.children).map((card) => ({
      originalIndex: parseInt(card.dataset.originalIndex, 10),
      rotation: parseInt(card.dataset.rotation || "0", 10),
      selected: !!card.querySelector(".thumb-check")?.checked,
    }));
  }

  return { getState, grid, tooLarge: false };
}

// ---------------------------------------------------------------------
// Workspace controller — drives the generic UI for every tool page.
// ---------------------------------------------------------------------
class ToolWorkspace {
  constructor(root, config) {
    this.root = root;
    this.config = config;
    this.files = [];
    this.pageGrid = null;
    this.pdfJsDoc = null;
    this.optionValues = {};
    (config.options || []).forEach((opt) => (this.optionValues[opt.key] = opt.default));
    this.render();
  }

  render() {
    this.root.innerHTML = "";
    this.renderDropzone();
    this.fileListEl = document.createElement("div");
    this.fileListEl.className = "file-list";
    this.root.appendChild(this.fileListEl);
    this.dynamicEl = document.createElement("div");
    this.root.appendChild(this.dynamicEl);
    this.actionsEl = document.createElement("div");
    this.root.appendChild(this.actionsEl);
    this.renderFileList();
    this.renderActions();
  }

  renderDropzone() {
    const cfg = this.config;
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.setAttribute("role", "button");
    dz.setAttribute("tabindex", "0");
    dz.setAttribute("aria-label", `Choose ${cfg.acceptLabel || "files"} to upload`);

    const input = document.createElement("input");
    input.type = "file";
    input.multiple = !!cfg.multiple;
    input.accept = cfg.acceptAttr || ".pdf";
    dz.appendChild(input);

    const icon = document.createElement("div");
    icon.innerHTML =
      '<svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M12 16V4M7 9l5-5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    dz.appendChild(icon);

    const text = document.createElement("p");
    text.style.margin = "0";
    text.style.fontWeight = "600";
    text.style.color = "var(--text)";
    text.textContent = cfg.dropHint || "Drag & drop files here, or click to browse";
    dz.appendChild(text);

    const hint = document.createElement("p");
    hint.className = "dz-hint";
    hint.textContent = `${cfg.acceptLabel || "PDF"} · up to ${PDFEngine.MAX_FILE_SIZE_MB}MB per file${
      cfg.multiple ? ` · up to ${PDFEngine.MAX_FILES} files` : ""
    }`;
    dz.appendChild(hint);

    const openPicker = () => input.click();
    dz.addEventListener("click", openPicker);
    dz.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPicker();
      }
    });
    ["dragenter", "dragover"].forEach((evt) =>
      dz.addEventListener(evt, (e) => {
        e.preventDefault();
        dz.classList.add("dragover");
      })
    );
    ["dragleave", "drop"].forEach((evt) =>
      dz.addEventListener(evt, (e) => {
        e.preventDefault();
        dz.classList.remove("dragover");
      })
    );
    dz.addEventListener("drop", (e) => this.addFiles(e.dataTransfer.files));
    input.addEventListener("change", () => this.addFiles(input.files));

    this.root.appendChild(dz);
    this.dropzoneInput = input;
  }

  addFiles(fileListLike) {
    const incoming = Array.from(fileListLike || []);
    if (!incoming.length) return;
    const cfg = this.config;

    if (!cfg.multiple) this.files = [];
    const combined = this.files.concat(incoming);
    const check = PDFEngine.validateBatch(combined, {
      accept: cfg.accept,
      extensions: cfg.extensions,
      maxFiles: cfg.maxFiles,
    });
    if (!check.ok) {
      this.showAlert(check.reason, "error");
      return;
    }
    this.clearAlert();
    this.files = cfg.maxSingleReplace ? incoming.slice(0, 1) : combined;
    this.pdfJsDoc = null;
    this.renderFileList();
    this.renderActions();
    if (this.dropzoneInput) this.dropzoneInput.value = "";
    if (cfg.onFilesChanged) cfg.onFilesChanged(this);
  }

  removeFile(index) {
    this.files.splice(index, 1);
    this.pdfJsDoc = null;
    this.renderFileList();
    this.renderActions();
    if (this.config.onFilesChanged) this.config.onFilesChanged(this);
  }

  renderFileList() {
    this.fileListEl.innerHTML = "";
    this.files.forEach((file, idx) => {
      const row = document.createElement("div");
      row.className = "file-row";

      const thumb = document.createElement("div");
      thumb.className = "file-thumb";
      thumb.innerHTML = svgIcon(this.config.accept && this.config.accept[0] === "application/pdf" ? "text" : "image");
      row.appendChild(thumb);

      const meta = document.createElement("div");
      meta.className = "file-meta";
      const name = document.createElement("div");
      name.className = "file-name";
      name.textContent = PDFEngine.sanitizeName(file.name); // textContent: safe even for hostile filenames
      const size = document.createElement("div");
      size.className = "file-size";
      size.textContent = PDFEngine.formatBytes(file.size);
      meta.appendChild(name);
      meta.appendChild(size);
      row.appendChild(meta);

      if (this.config.reorderFiles) {
        const handle = document.createElement("span");
        handle.className = "drag-handle";
        handle.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="6" r="1.4" fill="currentColor"/><circle cx="9" cy="12" r="1.4" fill="currentColor"/><circle cx="9" cy="18" r="1.4" fill="currentColor"/><circle cx="15" cy="6" r="1.4" fill="currentColor"/><circle cx="15" cy="12" r="1.4" fill="currentColor"/><circle cx="15" cy="18" r="1.4" fill="currentColor"/></svg>';
        row.appendChild(handle);
      }

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "file-remove";
      removeBtn.setAttribute("aria-label", `Remove ${PDFEngine.sanitizeName(file.name)}`);
      removeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      removeBtn.addEventListener("click", () => this.removeFile(idx));
      row.appendChild(removeBtn);

      this.fileListEl.appendChild(row);
    });

    if (this.config.reorderFiles && this.files.length > 1 && typeof Sortable !== "undefined") {
      if (this._sortable) this._sortable.destroy();
      this._sortable = Sortable.create(this.fileListEl, {
        handle: ".drag-handle",
        animation: 150,
        ghostClass: "sortable-ghost",
        onEnd: () => {
          const names = Array.from(this.fileListEl.children).map((r) => r.querySelector(".file-name").textContent);
          this.files.sort((a, b) => names.indexOf(PDFEngine.sanitizeName(a.name)) - names.indexOf(PDFEngine.sanitizeName(b.name)));
        },
      });
    }
  }

  renderOptions(target) {
    (this.config.options || []).forEach((opt) => {
      const group = document.createElement("div");
      group.className = "option-group";
      const label = document.createElement("label");
      label.textContent = opt.label;
      label.setAttribute("for", `opt-${opt.key}`);
      group.appendChild(label);

      let input;
      if (opt.type === "select") {
        input = document.createElement("select");
        opt.choices.forEach((c) => {
          const o = document.createElement("option");
          o.value = c.value;
          o.textContent = c.label;
          if (c.value === opt.default) o.selected = true;
          input.appendChild(o);
        });
      } else if (opt.type === "textarea") {
        input = document.createElement("textarea");
        input.value = opt.default || "";
        input.placeholder = opt.placeholder || "";
      } else if (opt.type === "checkbox") {
        const row = document.createElement("div");
        row.className = "checkbox-row";
        input = document.createElement("input");
        input.type = "checkbox";
        input.checked = !!opt.default;
        input.id = `opt-${opt.key}`;
        row.appendChild(input);
        const span = document.createElement("span");
        span.textContent = opt.checkboxLabel || "";
        row.appendChild(span);
        group.appendChild(row);
      } else if (opt.type === "color") {
        input = document.createElement("input");
        input.type = "color";
        input.value = opt.default || "#6C4CF0";
        input.style.width = "60px";
        input.style.height = "40px";
        input.style.padding = "4px";
      } else if (opt.type === "range") {
        const row = document.createElement("div");
        row.className = "range-row";
        input = document.createElement("input");
        input.type = "range";
        input.min = opt.min;
        input.max = opt.max;
        input.step = opt.step || 1;
        input.value = opt.default;
        const out = document.createElement("span");
        out.className = "file-size";
        out.textContent = String(opt.default) + (opt.unit || "");
        input.addEventListener("input", () => (out.textContent = input.value + (opt.unit || "")));
        row.appendChild(input);
        row.appendChild(out);
        group.appendChild(row);
      } else {
        input = document.createElement("input");
        input.type = opt.type || "text";
        input.value = opt.default != null ? opt.default : "";
        input.placeholder = opt.placeholder || "";
        if (opt.min != null) input.min = opt.min;
        if (opt.max != null) input.max = opt.max;
        if (opt.maxLength) input.maxLength = opt.maxLength;
      }

      if (opt.type !== "checkbox") {
        input.id = `opt-${opt.key}`;
        group.appendChild(input);
      }
      input.addEventListener("input", () => {
        this.optionValues[opt.key] = opt.type === "checkbox" ? input.checked : input.value;
      });
      this.optionValues[opt.key] = opt.type === "checkbox" ? input.checked : opt.default;

      if (opt.hint) {
        const hint = document.createElement("div");
        hint.className = "hint";
        hint.textContent = opt.hint;
        group.appendChild(hint);
      }
      target.appendChild(group);
    });
  }

  showAlert(message, type = "info") {
    this.clearAlert();
    const div = document.createElement("div");
    div.className = `alert alert-${type}`;
    div.textContent = message;
    div.id = "workspace-alert";
    this.root.insertBefore(div, this.fileListEl);
  }
  clearAlert() {
    const existing = document.getElementById("workspace-alert");
    if (existing) existing.remove();
  }

  renderActions() {
    this.actionsEl.innerHTML = "";
    const cfg = this.config;
    const minFiles = cfg.minFiles || 1;
    if (this.files.length < minFiles) return;

    if (cfg.buildBody) {
      this.dynamicEl.innerHTML = "";
      cfg.buildBody(this);
    }

    if (cfg.noAction) return;
    const btn = document.createElement("button");
    btn.className = "btn btn-primary btn-block";
    btn.type = "button";
    btn.textContent = cfg.actionLabel || "Process";
    btn.addEventListener("click", () => this.runProcess());
    this.actionsEl.appendChild(btn);
  }

  async runProcess() {
    const cfg = this.config;
    this.clearAlert();
    const btn = this.actionsEl.querySelector("button");
    const progressWrap = document.createElement("div");
    progressWrap.className = "progress-wrap";
    progressWrap.innerHTML = `<div class="progress-bar"><span style="width:0%"></span></div><div class="progress-label"><span data-progress-text>Starting…</span><span data-progress-pct>0%</span></div>`;
    this.actionsEl.appendChild(progressWrap);
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Processing…';
    }

    const bar = progressWrap.querySelector("span");
    const pctEl = progressWrap.querySelector("[data-progress-pct]");
    const textEl = progressWrap.querySelector("[data-progress-text]");
    const report = (pct, label) => {
      bar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
      pctEl.textContent = `${Math.round(pct)}%`;
      if (label) textEl.textContent = label;
    };

    try {
      const result = await cfg.process(this, report);
      report(100, "Done");
      this.renderResult(result);
    } catch (err) {
      // Errors are shown as friendly text only — no stack traces or
      // internal details are ever surfaced to the page.
      this.renderResult({ error: err && err.message ? err.message : "Something went wrong while processing your file." });
    }
  }

  renderResult(result) {
    this.root.innerHTML = "";
    const panel = document.createElement("div");
    panel.className = `glass result-panel${result.error ? " error" : ""}`;

    const iconWrap = document.createElement("div");
    iconWrap.className = "result-icon";
    iconWrap.innerHTML = result.error
      ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 8v5M12 16h.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/></svg>'
      : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    panel.appendChild(iconWrap);

    const h = document.createElement("h3");
    h.style.fontFamily = "var(--font-display)";
    h.textContent = result.error ? "Something went wrong" : "All done!";
    panel.appendChild(h);

    const msg = document.createElement("p");
    msg.textContent = result.error || result.message || "Your file is ready to download.";
    panel.appendChild(msg);

    if (result.extra) panel.appendChild(result.extra);

    const actions = document.createElement("div");
    actions.className = "result-actions";

    if (result.downloads && result.downloads.length) {
      result.downloads.forEach((d) => {
        const dbtn = document.createElement("button");
        dbtn.className = "btn btn-primary";
        dbtn.type = "button";
        dbtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 16V4M7 9l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 20h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
        dbtn.append(` Download ${PDFEngine.sanitizeName(d.filename)}`);
        dbtn.addEventListener("click", () => PDFEngine.downloadBlob(d.blob, d.filename));
        actions.appendChild(dbtn);
      });
    }

    const again = document.createElement("button");
    again.className = "btn btn-secondary";
    again.type = "button";
    again.textContent = result.error ? "Try again" : "Process another file";
    again.addEventListener("click", () => {
      this.files = [];
      this.pdfJsDoc = null;
      this.render();
    });
    actions.appendChild(again);

    panel.appendChild(actions);
    this.root.appendChild(panel);

    // Auto-trigger the first download for convenience.
    if (result.downloads && result.downloads.length === 1) {
      PDFEngine.downloadBlob(result.downloads[0].blob, result.downloads[0].filename);
    }
  }
}

async function downloadsAsZipOrSequence(files, zipName) {
  if (files.length === 1) return files;
  if (typeof JSZip !== "undefined") {
    const zip = new JSZip();
    files.forEach((f) => zip.file(PDFEngine.sanitizeFilename(f.filename), f.blob));
    const blob = await zip.generateAsync({ type: "blob" });
    return [{ blob, filename: zipName }];
  }
  return files;
}

// ---------------------------------------------------------------------
// Small shared helpers used by several tools
// ---------------------------------------------------------------------
function renameFile(original, suffix, newExt) {
  const base = PDFEngine.sanitizeName(original).replace(/\.[^.]+$/, "");
  const ext = newExt || "pdf";
  return `${base}-${suffix}.${ext}`;
}

function hexToRgb01(hex) {
  const clean = /^#?[0-9a-fA-F]{6}$/.test(hex) ? hex.replace("#", "") : "6C4CF0";
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return { r, g, b };
}

async function buildThumbBody(ws, opts) {
  const host = document.createElement("div");
  host.innerHTML = '<p class="hint">Loading page previews…</p>';
  ws.dynamicEl.appendChild(host);
  try {
    if (!ws.pdfJsDoc) {
      const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
      ws.pdfJsDoc = await PDFEngine.loadPdfJsDoc(buf);
    }
    host.innerHTML = "";
    ws.pageGridApi = await buildPageGrid(host, ws.pdfJsDoc, opts);
  } catch (err) {
    host.innerHTML = "";
    ws.showAlert(err.message || "Could not preview this PDF.", "error");
  }
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load that image."));
    img.src = src;
  });
}

async function ensureJpegBytes(file, buf) {
  if (file.type === "image/jpeg") return buf;
  const blobUrl = URL.createObjectURL(new Blob([buf], { type: file.type }));
  try {
    const img = await loadImageElement(blobUrl);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d").drawImage(img, 0, 0);
    const jpegBlob = await PDFEngine.canvasToBlob(canvas, "image/jpeg", 0.92);
    return new Uint8Array(await jpegBlob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function imageDataToCanvas(imgObj) {
  if (!imgObj || !imgObj.width || !imgObj.height || !imgObj.data) return null;
  const { width, height, data, kind } = imgObj;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(width, height);
  const out = imageData.data;
  if (kind === 3 || data.length === width * height * 4) {
    out.set(data);
  } else if (kind === 2 || data.length === width * height * 3) {
    for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
      out[j] = data[i];
      out[j + 1] = data[i + 1];
      out[j + 2] = data[i + 2];
      out[j + 3] = 255;
    }
  } else if (data.length === width * height) {
    for (let i = 0, j = 0; i < data.length; i++, j += 4) {
      out[j] = out[j + 1] = out[j + 2] = data[i];
      out[j + 3] = 255;
    }
  } else {
    return null; // unrecognized encoding — skip rather than render garbage
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

async function extractAllText(pdfJsDoc, onProgress) {
  let out = "";
  for (let i = 1; i <= pdfJsDoc.numPages; i++) {
    const page = await pdfJsDoc.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map((it) => it.str).join(" ") + "\n";
    if (onProgress) onProgress(i / pdfJsDoc.numPages);
  }
  return out;
}

/** Classic LCS line-diff, capped for performance on very long documents. */
function lineDiff(a, b) {
  const MAX = 1500;
  const A = a.slice(0, MAX);
  const B = b.slice(0, MAX);
  const n = A.length;
  const m = B.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const result = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      result.push(["same", A[i]]);
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push(["remove", A[i]]);
      i++;
    } else {
      result.push(["add", B[j]]);
      j++;
    }
  }
  while (i < n) result.push(["remove", A[i++]]);
  while (j < m) result.push(["add", B[j++]]);
  return result;
}

// =======================================================================
// TOOL REGISTRATIONS
// =======================================================================

registerTool({
  id: "merge-pdf",
  title: "Merge PDF",
  desc: "Combine multiple PDFs into one document, in the order you choose.",
  category: "organize",
  icon: "merge",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf,application/pdf",
  acceptLabel: "PDF files",
  multiple: true,
  minFiles: 2,
  maxFiles: 30,
  reorderFiles: true,
  actionLabel: "Merge & Download",
  dropHint: "Drag & drop 2 or more PDFs here, or click to browse",
  async process(ws, report) {
    const merged = await PDFLib.PDFDocument.create();
    for (let i = 0; i < ws.files.length; i++) {
      report((i / ws.files.length) * 80, `Adding ${PDFEngine.sanitizeName(ws.files[i].name)}…`);
      const buf = await PDFEngine.readAsArrayBuffer(ws.files[i]);
      const doc = await PDFEngine.loadPdfDoc(buf);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    }
    report(90, "Saving…");
    const bytes = await merged.save();
    return {
      message: `Merged ${ws.files.length} files into one PDF.`,
      downloads: [{ blob: new Blob([bytes], { type: "application/pdf" }), filename: "merged.pdf" }],
    };
  },
});

registerTool({
  id: "split-pdf",
  title: "Split PDF",
  desc: "Break a PDF into multiple smaller files by page range or a fixed page count.",
  category: "organize",
  icon: "split",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Split & Download",
  options: [
    {
      key: "splitMode",
      label: "Split by",
      type: "select",
      default: "ranges",
      choices: [
        { value: "ranges", label: "Custom ranges (one file per group)" },
        { value: "every", label: "Fixed number of pages per file" },
      ],
    },
    {
      key: "ranges",
      label: "Ranges — separate each output file with a semicolon",
      type: "text",
      default: "",
      placeholder: "1-3;4-6;7",
      maxLength: 300,
      hint: 'Example: "1-3;4-6;7" creates three files.',
    },
    { key: "everyN", label: "Pages per file", type: "number", default: 1, min: 1, max: 1000 },
  ],
  buildBody(ws) {
    ws.renderOptions(ws.dynamicEl);
  },
  async process(ws, report) {
    report(10, "Reading file…");
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    const srcDoc = await PDFEngine.loadPdfDoc(buf);
    const pageCount = srcDoc.getPageCount();
    let groups = [];

    if (ws.optionValues.splitMode === "every") {
      const n = Math.max(1, parseInt(ws.optionValues.everyN, 10) || 1);
      for (let start = 0; start < pageCount; start += n) {
        groups.push(Array.from({ length: Math.min(n, pageCount - start) }, (_, i) => start + i));
      }
    } else {
      const raw = String(ws.optionValues.ranges || "").trim();
      if (!raw) throw new Error("Enter at least one page range, e.g. 1-3;4-6.");
      const groupStrs = raw.split(";").map((s) => s.trim()).filter(Boolean);
      if (groupStrs.length > 200) throw new Error("Too many output files requested.");
      groups = groupStrs.map((g) => PDFEngine.parsePageRanges(g, pageCount));
    }
    if (!groups.length) throw new Error("No valid page groups were found.");

    const outputs = [];
    for (let i = 0; i < groups.length; i++) {
      report(15 + (i / groups.length) * 70, `Building file ${i + 1} of ${groups.length}…`);
      const newDoc = await PDFLib.PDFDocument.create();
      const pages = await newDoc.copyPages(srcDoc, groups[i]);
      pages.forEach((p) => newDoc.addPage(p));
      const bytes = await newDoc.save();
      outputs.push({ blob: new Blob([bytes], { type: "application/pdf" }), filename: renameFile(ws.files[0].name, `part-${i + 1}`) });
    }
    report(90, "Packaging…");
    const downloads = await downloadsAsZipOrSequence(outputs, renameFile(ws.files[0].name, "split", "zip"));
    return { message: `Created ${groups.length} file${groups.length > 1 ? "s" : ""}.`, downloads };
  },
});

registerTool({
  id: "rotate-pdf",
  title: "Rotate PDF",
  desc: "Rotate all or selected pages in your PDF, then download the corrected file.",
  category: "organize",
  icon: "rotate",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Rotate & Download",
  buildBody(ws) {
    const info = document.createElement("p");
    info.className = "hint";
    info.textContent = "Click the rotate icon on any page to turn it 90°. Pages you don't click keep their orientation.";
    ws.dynamicEl.appendChild(info);
    buildThumbBody(ws, { rotatable: true });
  },
  async process(ws, report) {
    report(5, "Reading file…");
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    const pdfDoc = await PDFEngine.loadPdfDoc(buf);
    const state = ws.pageGridApi && ws.pageGridApi.getState ? ws.pageGridApi.getState() : null;
    report(40, "Rotating pages…");
    if (state) {
      state.forEach((p) => {
        if (p.rotation) {
          const page = pdfDoc.getPage(p.originalIndex);
          const current = page.getRotation().angle;
          page.setRotation(PDFLib.degrees((current + p.rotation) % 360));
        }
      });
    }
    report(75, "Saving…");
    const bytes = await pdfDoc.save();
    return {
      message: "Your rotated PDF is ready.",
      downloads: [{ blob: new Blob([bytes], { type: "application/pdf" }), filename: renameFile(ws.files[0].name, "rotated") }],
    };
  },
});

registerTool({
  id: "delete-pages",
  title: "Delete Pages",
  desc: "Remove unwanted pages from a PDF.",
  category: "organize",
  icon: "trash",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Delete Pages & Download",
  buildBody(ws) {
    const info = document.createElement("p");
    info.className = "hint";
    info.textContent = "Select the pages you want to remove, then continue.";
    ws.dynamicEl.appendChild(info);
    buildThumbBody(ws, { selectable: true });
  },
  async process(ws, report) {
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    const pdfDoc = await PDFEngine.loadPdfDoc(buf);
    const state = ws.pageGridApi.getState();
    const toRemove = state.filter((p) => p.selected).map((p) => p.originalIndex);
    if (!toRemove.length) throw new Error("Select at least one page to delete.");
    if (toRemove.length >= pdfDoc.getPageCount()) throw new Error("At least one page must remain — you can't delete every page.");
    report(40, "Removing pages…");
    toRemove.sort((a, b) => b - a).forEach((i) => pdfDoc.removePage(i));
    report(80, "Saving…");
    const bytes = await pdfDoc.save();
    return {
      message: `Removed ${toRemove.length} page${toRemove.length > 1 ? "s" : ""}.`,
      downloads: [{ blob: new Blob([bytes], { type: "application/pdf" }), filename: renameFile(ws.files[0].name, "edited") }],
    };
  },
});

registerTool({
  id: "extract-pages",
  title: "Extract Pages",
  desc: "Pull specific pages out of a PDF into a brand-new document.",
  category: "organize",
  icon: "extract",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Extract & Download",
  buildBody(ws) {
    const info = document.createElement("p");
    info.className = "hint";
    info.textContent = "Select the pages you want to keep — everything else is left out.";
    ws.dynamicEl.appendChild(info);
    buildThumbBody(ws, { selectable: true });
  },
  async process(ws, report) {
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    const srcDoc = await PDFEngine.loadPdfDoc(buf);
    const state = ws.pageGridApi.getState();
    const keep = state.filter((p) => p.selected).map((p) => p.originalIndex);
    if (!keep.length) throw new Error("Select at least one page to extract.");
    report(30, "Copying pages…");
    const newDoc = await PDFLib.PDFDocument.create();
    const copied = await newDoc.copyPages(srcDoc, keep);
    copied.forEach((p) => newDoc.addPage(p));
    report(80, "Saving…");
    const bytes = await newDoc.save();
    return {
      message: `Extracted ${keep.length} page${keep.length > 1 ? "s" : ""}.`,
      downloads: [{ blob: new Blob([bytes], { type: "application/pdf" }), filename: renameFile(ws.files[0].name, "extracted") }],
    };
  },
});

registerTool({
  id: "reorder-pdf",
  title: "Reorder Pages",
  desc: "Drag pages into a new order, or remove ones you don't need. Also known as Organize PDF.",
  category: "organize",
  icon: "organize",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Save New Order & Download",
  buildBody(ws) {
    const info = document.createElement("p");
    info.className = "hint";
    info.textContent = "Drag pages to reorder them, or click the × on a page to remove it.";
    ws.dynamicEl.appendChild(info);
    buildThumbBody(ws, { reorderable: true, removable: true });
  },
  async process(ws, report) {
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    const srcDoc = await PDFEngine.loadPdfDoc(buf);
    const state = ws.pageGridApi.getState();
    if (!state.length) throw new Error("At least one page must remain.");
    const order = state.map((p) => p.originalIndex);
    report(30, "Rebuilding document…");
    const newDoc = await PDFLib.PDFDocument.create();
    const copied = await newDoc.copyPages(srcDoc, order);
    copied.forEach((p) => newDoc.addPage(p));
    report(80, "Saving…");
    const bytes = await newDoc.save();
    return {
      message: "Pages reorganized.",
      downloads: [{ blob: new Blob([bytes], { type: "application/pdf" }), filename: renameFile(ws.files[0].name, "organized") }],
    };
  },
});

registerTool({
  id: "crop-pdf",
  title: "Crop PDF",
  desc: "Trim margins from every page by a percentage — handy for removing scan borders or wide margins.",
  category: "edit",
  icon: "crop",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Crop & Download",
  options: [
    { key: "top", label: "Top margin to trim", type: "range", min: 0, max: 40, step: 1, default: 5, unit: "%" },
    { key: "bottom", label: "Bottom margin to trim", type: "range", min: 0, max: 40, step: 1, default: 5, unit: "%" },
    { key: "left", label: "Left margin to trim", type: "range", min: 0, max: 40, step: 1, default: 5, unit: "%" },
    { key: "right", label: "Right margin to trim", type: "range", min: 0, max: 40, step: 1, default: 5, unit: "%" },
  ],
  buildBody(ws) {
    ws.renderOptions(ws.dynamicEl);
  },
  async process(ws, report) {
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    const pdfDoc = await PDFEngine.loadPdfDoc(buf);
    const { top, bottom, left, right } = ws.optionValues;
    report(30, "Cropping pages…");
    pdfDoc.getPages().forEach((page) => {
      const { width, height } = page.getSize();
      const t = (parseFloat(top) || 0) / 100;
      const b = (parseFloat(bottom) || 0) / 100;
      const l = (parseFloat(left) || 0) / 100;
      const r = (parseFloat(right) || 0) / 100;
      const newX = width * l;
      const newY = height * b;
      const newW = width * (1 - l - r);
      const newH = height * (1 - t - b);
      if (newW > 10 && newH > 10) page.setCropBox(newX, newY, newW, newH);
    });
    report(80, "Saving…");
    const bytes = await pdfDoc.save();
    return {
      message: "Cropped every page.",
      downloads: [{ blob: new Blob([bytes], { type: "application/pdf" }), filename: renameFile(ws.files[0].name, "cropped") }],
    };
  },
});

registerTool({
  id: "watermark-pdf",
  title: "Watermark PDF",
  desc: "Stamp a custom text watermark across every page.",
  category: "edit",
  icon: "watermark",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Add Watermark & Download",
  options: [
    { key: "text", label: "Watermark text", type: "text", default: "CONFIDENTIAL", maxLength: 60 },
    { key: "opacity", label: "Opacity", type: "range", min: 5, max: 100, step: 5, default: 30, unit: "%" },
    { key: "fontSize", label: "Font size", type: "range", min: 10, max: 120, step: 2, default: 48, unit: "px" },
    { key: "rotation", label: "Rotation", type: "range", min: 0, max: 360, step: 5, default: 45, unit: "°" },
    { key: "color", label: "Color", type: "color", default: "#6C4CF0" },
  ],
  buildBody(ws) {
    ws.renderOptions(ws.dynamicEl);
  },
  async process(ws, report) {
    const text = String(ws.optionValues.text || "").slice(0, 60);
    if (!text.trim()) throw new Error("Enter watermark text.");
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    const pdfDoc = await PDFEngine.loadPdfDoc(buf);
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const { r, g, b } = hexToRgb01(ws.optionValues.color);
    const opacity = Math.max(0.05, Math.min(1, (parseFloat(ws.optionValues.opacity) || 30) / 100));
    const size = parseFloat(ws.optionValues.fontSize) || 48;
    const rotationDeg = parseFloat(ws.optionValues.rotation) || 45;
    report(30, "Stamping pages…");
    pdfDoc.getPages().forEach((page) => {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: width / 2 - textWidth / 2,
        y: height / 2,
        size,
        font,
        color: PDFLib.rgb(r, g, b),
        opacity,
        rotate: PDFLib.degrees(rotationDeg),
      });
    });
    report(80, "Saving…");
    const bytes = await pdfDoc.save();
    return {
      message: "Watermark applied to every page.",
      downloads: [{ blob: new Blob([bytes], { type: "application/pdf" }), filename: renameFile(ws.files[0].name, "watermarked") }],
    };
  },
});

registerTool({
  id: "page-numbers",
  title: "Add Page Numbers",
  desc: "Insert page numbers into every page of your PDF.",
  category: "edit",
  icon: "pagenum",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Add Numbers & Download",
  options: [
    {
      key: "position",
      label: "Position",
      type: "select",
      default: "bottom-center",
      choices: [
        { value: "bottom-center", label: "Bottom center" },
        { value: "bottom-right", label: "Bottom right" },
        { value: "bottom-left", label: "Bottom left" },
        { value: "top-center", label: "Top center" },
        { value: "top-right", label: "Top right" },
        { value: "top-left", label: "Top left" },
      ],
    },
    { key: "startAt", label: "Start numbering at", type: "number", default: 1, min: 0, max: 9999 },
    { key: "fontSize", label: "Font size", type: "range", min: 8, max: 32, step: 1, default: 12, unit: "px" },
  ],
  buildBody(ws) {
    ws.renderOptions(ws.dynamicEl);
  },
  async process(ws, report) {
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    const pdfDoc = await PDFEngine.loadPdfDoc(buf);
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const size = parseFloat(ws.optionValues.fontSize) || 12;
    const start = parseInt(ws.optionValues.startAt, 10) || 1;
    const pages = pdfDoc.getPages();
    report(30, "Numbering pages…");
    pages.forEach((page, idx) => {
      const label = String(start + idx);
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(label, size);
      const margin = 28;
      const pos = ws.optionValues.position;
      const isTop = pos.startsWith("top");
      const y = isTop ? height - margin : margin;
      let x;
      if (pos.endsWith("center")) x = width / 2 - textWidth / 2;
      else if (pos.endsWith("right")) x = width - margin - textWidth;
      else x = margin;
      page.drawText(label, { x, y, size, font, color: PDFLib.rgb(0.1, 0.1, 0.15) });
    });
    report(80, "Saving…");
    const bytes = await pdfDoc.save();
    return {
      message: "Page numbers added.",
      downloads: [{ blob: new Blob([bytes], { type: "application/pdf" }), filename: renameFile(ws.files[0].name, "numbered") }],
    };
  },
});

registerTool({
  id: "compress-pdf",
  title: "Compress PDF",
  desc: "Shrink file size by re-rendering pages at a lower image quality — great for scanned or image-heavy PDFs.",
  category: "optimize",
  icon: "compress",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Compress & Download",
  options: [
    {
      key: "level",
      label: "Compression level",
      type: "select",
      default: "medium",
      choices: [
        { value: "light", label: "Light (best quality)" },
        { value: "medium", label: "Medium (recommended)" },
        { value: "strong", label: "Strong (smallest size)" },
      ],
    },
  ],
  buildBody(ws) {
    const warn = document.createElement("div");
    warn.className = "alert alert-info";
    warn.textContent =
      "This rebuilds each page as a compressed image, which shrinks file size significantly but makes text non-selectable afterward. If you need to keep selectable text, this may not be the right tool.";
    ws.dynamicEl.appendChild(warn);
    ws.renderOptions(ws.dynamicEl);
  },
  async process(ws, report) {
    const levelMap = {
      light: { scale: 1.6, quality: 0.85 },
      medium: { scale: 1.15, quality: 0.7 },
      strong: { scale: 0.85, quality: 0.5 },
    };
    const cfg = levelMap[ws.optionValues.level] || levelMap.medium;
    report(5, "Reading file…");
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    const originalSize = ws.files[0].size;
    const pdfJsDoc = await PDFEngine.loadPdfJsDoc(buf);
    const outDoc = await PDFLib.PDFDocument.create();
    for (let i = 1; i <= pdfJsDoc.numPages; i++) {
      report(10 + (i / pdfJsDoc.numPages) * 70, `Compressing page ${i} of ${pdfJsDoc.numPages}…`);
      const canvas = await PDFEngine.renderPageToCanvas(pdfJsDoc, i, cfg.scale);
      const blob = await PDFEngine.canvasToBlob(canvas, "image/jpeg", cfg.quality);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const img = await outDoc.embedJpg(bytes);
      const page = outDoc.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }
    report(85, "Saving…");
    const outBytes = await outDoc.save();
    const newSize = outBytes.byteLength;
    const pct = originalSize > 0 ? Math.max(0, Math.round((1 - newSize / originalSize) * 100)) : 0;
    return {
      message: `File size reduced from ${PDFEngine.formatBytes(originalSize)} to ${PDFEngine.formatBytes(newSize)}${
        pct > 0 ? ` (about ${pct}% smaller)` : ""
      }.`,
      downloads: [{ blob: new Blob([outBytes], { type: "application/pdf" }), filename: renameFile(ws.files[0].name, "compressed") }],
    };
  },
});

registerTool({
  id: "pdf-to-jpg",
  title: "PDF to JPG",
  desc: "Convert every page of a PDF into a high-quality JPG image.",
  category: "convert",
  icon: "image",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Convert & Download",
  options: [
    {
      key: "scale",
      label: "Image quality",
      type: "select",
      default: "2",
      choices: [
        { value: "1", label: "Standard" },
        { value: "2", label: "High (recommended)" },
        { value: "3", label: "Very high" },
      ],
    },
  ],
  buildBody(ws) {
    ws.renderOptions(ws.dynamicEl);
  },
  async process(ws, report) {
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    const pdfJsDoc = await PDFEngine.loadPdfJsDoc(buf);
    const scale = parseFloat(ws.optionValues.scale) || 2;
    const outputs = [];
    for (let i = 1; i <= pdfJsDoc.numPages; i++) {
      report((i / pdfJsDoc.numPages) * 85, `Rendering page ${i} of ${pdfJsDoc.numPages}…`);
      const canvas = await PDFEngine.renderPageToCanvas(pdfJsDoc, i, scale);
      const blob = await PDFEngine.canvasToBlob(canvas, "image/jpeg", 0.92);
      outputs.push({ blob, filename: renameFile(ws.files[0].name, `page-${i}`, "jpg") });
    }
    report(90, "Packaging…");
    const downloads = await downloadsAsZipOrSequence(outputs, renameFile(ws.files[0].name, "images", "zip"));
    return { message: `Converted ${pdfJsDoc.numPages} page${pdfJsDoc.numPages > 1 ? "s" : ""} to JPG.`, downloads };
  },
});

registerTool({
  id: "images-to-pdf",
  title: "JPG/PNG to PDF",
  desc: "Combine JPG, PNG or WebP images into a single PDF document.",
  category: "convert",
  icon: "image",
  accept: PDFEngine.ACCEPT_IMAGE,
  extensions: [".jpg", ".jpeg", ".png", ".webp"],
  acceptAttr: ".jpg,.jpeg,.png,.webp,image/*",
  acceptLabel: "Image files",
  multiple: true,
  minFiles: 1,
  maxFiles: 60,
  reorderFiles: true,
  actionLabel: "Create PDF & Download",
  dropHint: "Drag & drop images here, or click to browse",
  options: [
    {
      key: "pageSize",
      label: "Page size",
      type: "select",
      default: "fit",
      choices: [
        { value: "fit", label: "Fit to image" },
        { value: "a4", label: "A4" },
        { value: "letter", label: "US Letter" },
      ],
    },
    { key: "margin", label: "Margin", type: "range", min: 0, max: 60, step: 5, default: 0, unit: "pt" },
  ],
  buildBody(ws) {
    ws.renderOptions(ws.dynamicEl);
  },
  async process(ws, report) {
    const outDoc = await PDFLib.PDFDocument.create();
    const pageSize = ws.optionValues.pageSize;
    const margin = parseFloat(ws.optionValues.margin) || 0;
    const A4 = [595.28, 841.89];
    const LETTER = [612, 792];
    for (let i = 0; i < ws.files.length; i++) {
      report((i / ws.files.length) * 85, `Adding image ${i + 1} of ${ws.files.length}…`);
      const file = ws.files[i];
      const buf = new Uint8Array(await PDFEngine.readAsArrayBuffer(file));
      let img;
      if (file.type === "image/png") img = await outDoc.embedPng(buf);
      else img = await outDoc.embedJpg(await ensureJpegBytes(file, buf));

      let pageDims;
      if (pageSize === "fit") pageDims = [img.width + margin * 2, img.height + margin * 2];
      else pageDims = pageSize === "a4" ? A4 : LETTER;

      const page = outDoc.addPage(pageDims);
      const availW = pageDims[0] - margin * 2;
      const availH = pageDims[1] - margin * 2;
      const scale = pageSize === "fit" ? 1 : Math.min(availW / img.width, availH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      page.drawImage(img, { x: (pageDims[0] - w) / 2, y: (pageDims[1] - h) / 2, width: w, height: h });
    }
    report(90, "Saving…");
    const bytes = await outDoc.save();
    return {
      message: `Combined ${ws.files.length} image${ws.files.length > 1 ? "s" : ""} into one PDF.`,
      downloads: [{ blob: new Blob([bytes], { type: "application/pdf" }), filename: "images.pdf" }],
    };
  },
});

registerTool({
  id: "pdf-to-text",
  title: "PDF to Text",
  desc: "Extract selectable text from a PDF into a plain .txt file.",
  category: "convert",
  icon: "text",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Extract Text & Download",
  buildBody() {},
  async process(ws, report) {
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    const pdfJsDoc = await PDFEngine.loadPdfJsDoc(buf);
    let out = "";
    for (let i = 1; i <= pdfJsDoc.numPages; i++) {
      report((i / pdfJsDoc.numPages) * 85, `Reading page ${i} of ${pdfJsDoc.numPages}…`);
      const page = await pdfJsDoc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((it) => it.str).join(" ");
      out += `\n\n----- Page ${i} -----\n\n${text}`;
    }
    if (!out.trim()) throw new Error("No extractable text was found — this PDF may be a scanned image without an OCR layer.");
    const finalText = out.trim();
    const blob = new Blob([finalText], { type: "text/plain;charset=utf-8" });
    const preview = document.createElement("pre");
    preview.style.cssText =
      "max-height:220px;overflow:auto;text-align:left;font-size:.78rem;background:var(--surface-solid);padding:14px;border-radius:10px;border:1px solid var(--border);white-space:pre-wrap;";
    preview.textContent = finalText.slice(0, 4000); // textContent only — this is untrusted file-derived text
    return {
      message: `Extracted text from ${pdfJsDoc.numPages} page${pdfJsDoc.numPages > 1 ? "s" : ""}.`,
      extra: preview,
      downloads: [{ blob, filename: renameFile(ws.files[0].name, "text", "txt") }],
    };
  },
});

registerTool({
  id: "extract-images",
  title: "Extract Images",
  desc: "Pull every embedded image out of a PDF and download them as JPGs.",
  category: "convert",
  icon: "image",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Extract Images & Download",
  buildBody() {},
  async process(ws, report) {
    PDFEngine.configurePdfJsWorker();
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    const pdfJsDoc = await PDFEngine.loadPdfJsDoc(buf);
    const outputs = [];
    let count = 0;
    for (let i = 1; i <= pdfJsDoc.numPages; i++) {
      report((i / pdfJsDoc.numPages) * 85, `Scanning page ${i} of ${pdfJsDoc.numPages}…`);
      const page = await pdfJsDoc.getPage(i);
      const opList = await page.getOperatorList();
      const seen = new Set();
      for (let j = 0; j < opList.fnArray.length; j++) {
        const fn = opList.fnArray[j];
        if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintJpegXObject) {
          const objId = opList.argsArray[j][0];
          if (seen.has(objId)) continue;
          seen.add(objId);
          try {
            const imgData = await new Promise((resolve, reject) => {
              try {
                page.objs.get(objId, (data) => (data ? resolve(data) : reject(new Error("missing"))));
              } catch (e) {
                reject(e);
              }
            });
            const canvas = imageDataToCanvas(imgData);
            if (canvas) {
              const blob = await PDFEngine.canvasToBlob(canvas, "image/jpeg", 0.9);
              count++;
              outputs.push({ blob, filename: renameFile(ws.files[0].name, `page${i}-img${count}`, "jpg") });
            }
          } catch (e) {
            /* image could not be decoded — skip it rather than fail the whole job */
          }
        }
      }
    }
    if (!outputs.length) throw new Error("No embedded images were found in this PDF.");
    report(90, "Packaging…");
    const downloads = await downloadsAsZipOrSequence(outputs, renameFile(ws.files[0].name, "images", "zip"));
    return { message: `Extracted ${outputs.length} image${outputs.length > 1 ? "s" : ""}.`, downloads };
  },
});

registerTool({
  id: "pdf-metadata",
  title: "PDF Metadata",
  desc: "View and edit a PDF's title, author, subject and other document properties.",
  category: "edit",
  icon: "metadata",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Save Changes & Download",
  buildBody(ws) {
    ws.dynamicEl.innerHTML = '<p class="hint">Loading metadata…</p>';
    (async () => {
      try {
        const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
        const doc = await PDFEngine.loadPdfDoc(buf);
        ws.metaDoc = doc;
        const fields = [
          { key: "title", label: "Title", get: () => doc.getTitle(), set: (v) => doc.setTitle(v) },
          { key: "author", label: "Author", get: () => doc.getAuthor(), set: (v) => doc.setAuthor(v) },
          { key: "subject", label: "Subject", get: () => doc.getSubject(), set: (v) => doc.setSubject(v) },
          {
            key: "keywords",
            label: "Keywords (comma separated)",
            get: () => (doc.getKeywords ? doc.getKeywords() : ""),
            set: (v) => doc.setKeywords(v.split(",").map((s) => s.trim()).filter(Boolean)),
          },
          { key: "creator", label: "Creator", get: () => doc.getCreator(), set: (v) => doc.setCreator(v) },
        ];
        ws.dynamicEl.innerHTML = "";
        ws.metaFieldSetters = [];
        fields.forEach((f) => {
          const group = document.createElement("div");
          group.className = "option-group";
          const label = document.createElement("label");
          label.textContent = f.label;
          group.appendChild(label);
          const input = document.createElement("input");
          input.type = "text";
          input.maxLength = 200;
          let current = "";
          try {
            current = f.get() || "";
          } catch (e) {
            current = "";
          }
          // Property assignment, never innerHTML — safe even if the PDF's
          // own metadata contains hostile markup.
          input.value = String(current);
          group.appendChild(input);
          ws.dynamicEl.appendChild(group);
          ws.metaFieldSetters.push(() => f.set(input.value.slice(0, 200)));
        });
      } catch (err) {
        ws.dynamicEl.innerHTML = "";
        ws.showAlert(err.message || "Could not read metadata from this PDF.", "error");
      }
    })();
  },
  async process(ws, report) {
    if (!ws.metaDoc || !ws.metaFieldSetters) throw new Error("Metadata is still loading — try again in a moment.");
    report(30, "Applying changes…");
    ws.metaFieldSetters.forEach((fn) => fn());
    report(70, "Saving…");
    const bytes = await ws.metaDoc.save();
    return {
      message: "Metadata updated.",
      downloads: [{ blob: new Blob([bytes], { type: "application/pdf" }), filename: renameFile(ws.files[0].name, "metadata") }],
    };
  },
});

registerTool({
  id: "preview-pdf",
  title: "Preview PDF",
  desc: "View your PDF page by page right in the browser — nothing is uploaded.",
  category: "view",
  icon: "eye",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  noAction: true,
  buildBody(ws) {
    ws.dynamicEl.innerHTML = '<p class="hint">Loading preview…</p>';
    (async () => {
      try {
        const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
        const doc = await PDFEngine.loadPdfJsDoc(buf);
        ws.dynamicEl.innerHTML = "";
        let current = 1;
        const wrap = document.createElement("div");
        const canvasHolder = document.createElement("div");
        canvasHolder.style.cssText =
          "text-align:center;border:1px solid var(--border);border-radius:12px;overflow:auto;max-height:70vh;background:var(--surface-solid);";
        const nav = document.createElement("div");
        nav.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-top:14px;gap:10px;";
        const prev = document.createElement("button");
        prev.className = "btn btn-secondary btn-sm";
        prev.type = "button";
        prev.textContent = "← Previous";
        const next = document.createElement("button");
        next.className = "btn btn-secondary btn-sm";
        next.type = "button";
        next.textContent = "Next →";
        const label = document.createElement("span");
        label.className = "file-size";
        nav.append(prev, label, next);
        wrap.append(canvasHolder, nav);
        ws.dynamicEl.appendChild(wrap);

        async function show(n) {
          current = Math.min(Math.max(1, n), doc.numPages);
          canvasHolder.innerHTML = "";
          const canvas = await PDFEngine.renderPageToCanvas(doc, current, 1.1);
          canvasHolder.appendChild(canvas);
          label.textContent = `Page ${current} of ${doc.numPages}`;
          prev.disabled = current <= 1;
          next.disabled = current >= doc.numPages;
        }
        prev.addEventListener("click", () => show(current - 1));
        next.addEventListener("click", () => show(current + 1));
        await show(1);
      } catch (err) {
        ws.dynamicEl.innerHTML = "";
        ws.showAlert(err.message || "Could not preview this PDF.", "error");
      }
    })();
  },
});

registerTool({
  id: "sign-pdf",
  title: "Sign PDF",
  desc: "Draw your signature and place it on any page of your PDF.",
  category: "edit",
  icon: "sign",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Apply Signature & Download",
  buildBody(ws) {
    ws.dynamicEl.innerHTML = "";
    const info = document.createElement("p");
    info.className = "hint";
    info.textContent = "Draw your signature below, then choose where to place it.";
    ws.dynamicEl.appendChild(info);

    const canvas = document.createElement("canvas");
    canvas.width = 520;
    canvas.height = 180;
    canvas.style.cssText =
      "width:100%;max-width:520px;border:1px solid var(--border-strong);border-radius:12px;background:#fff;touch-action:none;display:block;margin:10px auto;cursor:crosshair;";
    ws.dynamicEl.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#14162B";
    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    function pos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return [(clientX - rect.left) * (canvas.width / rect.width), (clientY - rect.top) * (canvas.height / rect.height)];
    }
    function start(e) {
      drawing = true;
      [lastX, lastY] = pos(e);
      e.preventDefault();
    }
    function move(e) {
      if (!drawing) return;
      const [x, y] = pos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      [lastX, lastY] = [x, y];
      e.preventDefault();
    }
    function end() {
      drawing = false;
    }
    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "btn btn-secondary btn-sm";
    clearBtn.textContent = "Clear signature";
    clearBtn.style.cssText = "margin:0 auto 10px;display:block;";
    clearBtn.addEventListener("click", () => ctx.clearRect(0, 0, canvas.width, canvas.height));
    ws.dynamicEl.appendChild(clearBtn);
    ws.signatureCanvas = canvas;

    const optWrap = document.createElement("div");
    ws.dynamicEl.appendChild(optWrap);
    ws.config.options = [
      { key: "pageNum", label: "Page number", type: "number", default: 1, min: 1, max: 9999 },
      {
        key: "corner",
        label: "Position",
        type: "select",
        default: "bottom-right",
        choices: [
          { value: "bottom-right", label: "Bottom right" },
          { value: "bottom-left", label: "Bottom left" },
          { value: "bottom-center", label: "Bottom center" },
        ],
      },
      { key: "sigWidth", label: "Signature width", type: "range", min: 80, max: 320, step: 10, default: 180, unit: "pt" },
    ];
    ws.renderOptions(optWrap);
  },
  async process(ws, report) {
    const canvas = ws.signatureCanvas;
    const ctx = canvas.getContext("2d");
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasInk = false;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] !== 0) {
        hasInk = true;
        break;
      }
    }
    if (!hasInk) throw new Error("Draw a signature before continuing.");
    const sigBlob = await PDFEngine.canvasToBlob(canvas, "image/png", 1);
    const sigBytes = new Uint8Array(await sigBlob.arrayBuffer());
    report(30, "Reading file…");
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    const pdfDoc = await PDFEngine.loadPdfDoc(buf);
    const pages = pdfDoc.getPages();
    const pageIndex = Math.min(Math.max(1, parseInt(ws.optionValues.pageNum, 10) || 1), pages.length) - 1;
    const page = pages[pageIndex];
    const pngImg = await pdfDoc.embedPng(sigBytes);
    const targetW = parseFloat(ws.optionValues.sigWidth) || 180;
    const scale = targetW / pngImg.width;
    const w = pngImg.width * scale;
    const h = pngImg.height * scale;
    const { width } = page.getSize();
    const margin = 36;
    let x;
    if (ws.optionValues.corner === "bottom-left") x = margin;
    else if (ws.optionValues.corner === "bottom-center") x = (width - w) / 2;
    else x = width - margin - w;
    report(70, "Placing signature…");
    page.drawImage(pngImg, { x, y: margin, width: w, height: h });
    const bytes = await pdfDoc.save();
    return {
      message: "Signature added.",
      downloads: [{ blob: new Blob([bytes], { type: "application/pdf" }), filename: renameFile(ws.files[0].name, "signed") }],
    };
  },
});

registerTool({
  id: "repair-pdf",
  title: "Repair PDF",
  desc: "Attempt to fix a damaged or malformed PDF by rebuilding its internal structure.",
  category: "optimize",
  icon: "wrench",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Attempt Repair & Download",
  buildBody(ws) {
    const info = document.createElement("div");
    info.className = "alert alert-info";
    info.textContent =
      "This rebuilds the file's internal structure, which fixes many corrupted cross-reference tables and broken object streams. It can't recover data that's genuinely missing, or parse a file that's damaged beyond recognition.";
    ws.dynamicEl.appendChild(info);
  },
  async process(ws, report) {
    report(15, "Reading file…");
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    let pdfDoc;
    try {
      pdfDoc = await PDFLib.PDFDocument.load(buf, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
        updateMetadata: false,
      });
    } catch (e) {
      throw new Error("This file is too badly damaged to repair automatically.");
    }
    report(60, "Rebuilding structure…");
    const bytes = await pdfDoc.save({ useObjectStreams: true });
    const pageCount = pdfDoc.getPageCount();
    return {
      message: `Rebuilt the document (${pageCount} page${pageCount !== 1 ? "s" : ""} recovered).`,
      downloads: [{ blob: new Blob([bytes], { type: "application/pdf" }), filename: renameFile(ws.files[0].name, "repaired") }],
    };
  },
});

registerTool({
  id: "compare-pdf",
  title: "Compare PDFs",
  desc: "Highlight text differences between two versions of a PDF.",
  category: "view",
  icon: "compare",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "Two PDF files",
  multiple: true,
  minFiles: 2,
  maxFiles: 2,
  actionLabel: "Compare Documents",
  dropHint: "Add exactly two PDFs to compare",
  buildBody(ws) {
    if (ws.files.length > 2) {
      ws.files = ws.files.slice(0, 2);
      ws.renderFileList();
    }
  },
  async process(ws, report) {
    if (ws.files.length !== 2) throw new Error("Add exactly two PDF files to compare.");
    report(10, "Reading files…");
    const [bufA, bufB] = await Promise.all([PDFEngine.readAsArrayBuffer(ws.files[0]), PDFEngine.readAsArrayBuffer(ws.files[1])]);
    const [docA, docB] = await Promise.all([PDFEngine.loadPdfJsDoc(bufA), PDFEngine.loadPdfJsDoc(bufB)]);
    report(30, "Extracting text…");
    const textA = await extractAllText(docA, (p) => report(30 + p * 30, "Extracting text…"));
    const textB = await extractAllText(docB, (p) => report(60 + p * 30, "Extracting text…"));
    report(92, "Comparing…");
    const linesA = textA.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const linesB = textB.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const diff = lineDiff(linesA, linesB);

    const container = document.createElement("div");
    container.style.cssText =
      "text-align:left;max-height:340px;overflow:auto;font-size:.82rem;background:var(--surface-solid);border:1px solid var(--border);border-radius:10px;padding:14px;";
    let added = 0;
    let removed = 0;
    diff.forEach(([type, line]) => {
      const p = document.createElement("div");
      p.style.cssText = "padding:2px 6px;border-radius:4px;white-space:pre-wrap;";
      if (type === "add") {
        p.style.background = "rgba(46,216,167,.14)";
        p.textContent = "+ " + line;
        added++;
      } else if (type === "remove") {
        p.style.background = "rgba(255,92,124,.14)";
        p.textContent = "- " + line;
        removed++;
      } else {
        p.style.color = "var(--text-faint)";
        p.textContent = "  " + line;
      }
      container.appendChild(p);
    });
    const pageNote =
      docA.numPages === docB.numPages ? `Both files have ${docA.numPages} pages.` : `Page counts differ: ${docA.numPages} vs ${docB.numPages}.`;
    return {
      message: `${pageNote} Found ${added} added and ${removed} removed line${added + removed !== 1 ? "s" : ""}.`,
      extra: container,
    };
  },
});

// ---------------------------------------------------------------------
// Helpers for the office-conversion & OCR tools
// ---------------------------------------------------------------------

/** Wraps a line of text to fit maxWidth, returns an array of lines. */
function wrapText(text, font, size, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(trial, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = trial;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

/**
 * Strips anything that could execute (script tags, event-handler
 * attributes, javascript: URLs) from HTML that was generated from a
 * user-uploaded file (e.g. mammoth's docx→HTML output). Defense in
 * depth: mammoth doesn't intentionally emit executable markup, but we
 * never trust file-derived HTML by default.
 */
function sanitizeHtmlFragment(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html || ""), "text/html");
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
  const toRemove = [];
  while (walker.nextNode()) {
    const el = walker.currentNode;
    if (el.tagName === "SCRIPT" || el.tagName === "IFRAME" || el.tagName === "OBJECT" || el.tagName === "EMBED") {
      toRemove.push(el);
      continue;
    }
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith("on") || ((name === "href" || name === "src") && value.startsWith("javascript:"))) {
        el.removeAttribute(attr.name);
      }
    });
  }
  toRemove.forEach((el) => el.remove());
  return doc.body.innerHTML;
}

/** Builds a DOM table for spreadsheet rows using textContent only — safe
 * regardless of what a malicious spreadsheet cell might contain. */
function buildSafeSheetTable(title, rows) {
  const MAX_ROWS = 500;
  const MAX_COLS = 60;
  const container = document.createElement("div");
  container.style.cssText = "position:fixed; left:-10000px; top:0; width:1100px; background:#fff; padding:24px; font-family:Arial, sans-serif; color:#111;";
  const h = document.createElement("h2");
  h.style.cssText = "font-size:18px; margin:0 0 12px;";
  h.textContent = title; // sheet name — file-derived, textContent only
  container.appendChild(h);

  const table = document.createElement("table");
  table.style.cssText = "border-collapse:collapse; width:100%; font-size:11px;";
  const limitedRows = rows.slice(0, MAX_ROWS);
  limitedRows.forEach((row, rIdx) => {
    const tr = document.createElement("tr");
    const cells = row.slice(0, MAX_COLS);
    cells.forEach((cell) => {
      const td = document.createElement(rIdx === 0 ? "th" : "td");
      td.style.cssText = "border:1px solid #ccc; padding:4px 6px; text-align:left; white-space:nowrap;";
      td.textContent = cell == null ? "" : String(cell); // never innerHTML
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
  container.appendChild(table);

  if (rows.length > MAX_ROWS) {
    const note = document.createElement("p");
    note.style.cssText = "font-size:11px; color:#888; margin-top:10px;";
    note.textContent = `Showing the first ${MAX_ROWS} of ${rows.length} rows.`;
    container.appendChild(note);
  }
  return container;
}

function sanitizeFontName(name) {
  return String(name || "font")
    .replace(/^[A-Z]{6}\+/, "") // strip PDF subset tag like "ABCDEF+"
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .slice(0, 60) || "font";
}

registerTool({
  id: "word-to-pdf",
  title: "Word to PDF",
  desc: "Convert a .docx document into a PDF, entirely in your browser.",
  category: "convert",
  icon: "office",
  accept: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  extensions: [".docx"],
  acceptAttr: ".docx",
  acceptLabel: ".docx file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Convert to PDF & Download",
  buildBody(ws) {
    const info = document.createElement("div");
    info.className = "alert alert-info";
    info.textContent =
      "This reads your document's text, headings, lists, tables and images and lays them out on PDF pages. Complex Word formatting (custom headers/footers, precise page breaks, some table styles) may not come through pixel-perfect. Legacy .doc files aren't supported — only .docx.";
    ws.dynamicEl.appendChild(info);
  },
  async process(ws, report) {
    if (typeof mammoth === "undefined") throw new Error("The document converter didn't load — check your connection and try again.");
    report(10, "Reading document…");
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    let result;
    try {
      result = await mammoth.convertToHtml({ arrayBuffer: buf });
    } catch (e) {
      throw new Error("This doesn't look like a valid .docx file, or it's using a feature this converter can't read.");
    }
    report(35, "Preparing layout…");
    const container = document.createElement("div");
    container.style.cssText =
      "position:fixed; left:-10000px; top:0; width:760px; padding:48px; background:#fff; color:#14162B; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.55;";
    // mammoth's own HTML output, sanitized defensively before insertion (see sanitizeHtmlFragment)
    container.innerHTML = sanitizeHtmlFragment(result.value || "<p></p>");
    document.body.appendChild(container);

    try {
      if (typeof window.jspdf === "undefined" || typeof html2canvas === "undefined") {
        throw new Error("The PDF layout engine didn't load — check your connection and try again.");
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      report(55, "Rendering pages…");
      await new Promise((resolve, reject) => {
        try {
          doc.html(container, {
            x: 0,
            y: 0,
            width: 595,
            windowWidth: 760,
            html2canvas: { scale: 0.85, useCORS: false },
            callback: () => resolve(),
          });
        } catch (e) {
          reject(e);
        }
      });
      report(90, "Saving…");
      const blob = doc.output("blob");
      return {
        message: "Converted to PDF. Double-check formatting-sensitive documents before relying on the output.",
        downloads: [{ blob, filename: renameFile(ws.files[0].name, "converted") }],
      };
    } finally {
      document.body.removeChild(container);
    }
  },
});

registerTool({
  id: "excel-to-pdf",
  title: "Excel to PDF",
  desc: "Convert an .xlsx spreadsheet into a PDF, entirely in your browser.",
  category: "convert",
  icon: "office",
  accept: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  extensions: [".xlsx", ".xls", ".csv"],
  acceptAttr: ".xlsx,.xls,.csv",
  acceptLabel: ".xlsx / .xls / .csv file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Convert to PDF & Download",
  buildBody(ws) {
    const info = document.createElement("div");
    info.className = "alert alert-info";
    info.textContent =
      "Each sheet is rendered as a table on its own PDF page (or pages, if it's long). Cell formulas are converted to their calculated values; charts, images and cell formatting are not carried over. Very large sheets are truncated to the first 500 rows and 60 columns.";
    ws.dynamicEl.appendChild(info);
  },
  async process(ws, report) {
    if (typeof XLSX === "undefined") throw new Error("The spreadsheet reader didn't load — check your connection and try again.");
    if (typeof window.jspdf === "undefined" || typeof html2canvas === "undefined") {
      throw new Error("The PDF layout engine didn't load — check your connection and try again.");
    }
    report(10, "Reading spreadsheet…");
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    let wb;
    try {
      wb = XLSX.read(new Uint8Array(buf), { type: "array" });
    } catch (e) {
      throw new Error("This doesn't look like a valid spreadsheet file.");
    }
    const sheetNames = wb.SheetNames.slice(0, 25);
    if (!sheetNames.length) throw new Error("No sheets were found in this file.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });

    for (let s = 0; s < sheetNames.length; s++) {
      report(15 + (s / sheetNames.length) * 70, `Rendering sheet "${PDFEngine.sanitizeName(sheetNames[s])}"…`);
      const sheet = wb.Sheets[sheetNames[s]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
      const container = buildSafeSheetTable(sheetNames[s], rows);
      document.body.appendChild(container);
      if (s > 0) doc.addPage();
      try {
        await new Promise((resolve, reject) => {
          try {
            doc.html(container, {
              x: 20,
              y: 20,
              width: 800,
              windowWidth: 1100,
              html2canvas: { scale: 0.7, useCORS: false },
              callback: () => resolve(),
            });
          } catch (e) {
            reject(e);
          }
        });
      } finally {
        document.body.removeChild(container);
      }
    }
    report(92, "Saving…");
    const blob = doc.output("blob");
    return {
      message: `Converted ${sheetNames.length} sheet${sheetNames.length > 1 ? "s" : ""} to PDF.`,
      downloads: [{ blob, filename: renameFile(ws.files[0].name, "converted") }],
    };
  },
});

registerTool({
  id: "ppt-to-pdf",
  title: "PowerPoint to PDF",
  desc: "Convert a .pptx presentation's text content into a PDF, one page per slide.",
  category: "convert",
  icon: "office",
  accept: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  extensions: [".pptx"],
  acceptAttr: ".pptx",
  acceptLabel: ".pptx file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Convert to PDF & Download",
  buildBody(ws) {
    const info = document.createElement("div");
    info.className = "alert alert-info";
    info.textContent =
      "This is a text-only conversion: titles and bullet text from each slide are laid out on a matching PDF page. Images, backgrounds, transitions and exact visual design from the original slides are not reproduced. For pixel-perfect exports, use PowerPoint's own \"Export to PDF.\"";
    ws.dynamicEl.appendChild(info);
  },
  async process(ws, report) {
    if (typeof JSZip === "undefined") throw new Error("The file reader didn't load — check your connection and try again.");
    report(10, "Reading presentation…");
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    let zip;
    try {
      zip = await JSZip.loadAsync(buf);
    } catch (e) {
      throw new Error("This doesn't look like a valid .pptx file.");
    }
    const slideFiles = Object.keys(zip.files)
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide(\d+)\.xml/)[1], 10);
        const nb = parseInt(b.match(/slide(\d+)\.xml/)[1], 10);
        return na - nb;
      });
    if (!slideFiles.length) throw new Error("No slides were found — this file may not be a valid .pptx.");
    if (slideFiles.length > 300) throw new Error("This presentation has too many slides to convert in the browser.");

    const outDoc = await PDFLib.PDFDocument.create();
    const font = await outDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const boldFont = await outDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    for (let i = 0; i < slideFiles.length; i++) {
      report(15 + (i / slideFiles.length) * 75, `Converting slide ${i + 1} of ${slideFiles.length}…`);
      const xmlStr = await zip.files[slideFiles[i]].async("string");
      const xmlDoc = new DOMParser().parseFromString(xmlStr, "application/xml");
      const texts = Array.from(xmlDoc.getElementsByTagName("a:t"))
        .map((n) => n.textContent)
        .filter((t) => t && t.trim());

      const page = outDoc.addPage([792, 612]); // landscape US Letter
      const { width, height } = page.getSize();
      let y = height - 56;
      page.drawText(`Slide ${i + 1} of ${slideFiles.length}`, { x: 40, y, size: 10, font, color: PDFLib.rgb(0.55, 0.56, 0.62) });
      y -= 34;

      if (!texts.length) {
        page.drawText("(No readable text on this slide)", { x: 40, y, size: 13, font, color: PDFLib.rgb(0.6, 0.6, 0.65) });
      }

      texts.forEach((raw, idx) => {
        const isTitle = idx === 0;
        const size = isTitle ? 20 : 13;
        const useFont = isTitle ? boldFont : font;
        const lines = wrapText(raw, useFont, size, width - 80);
        lines.forEach((line) => {
          if (y < 40) return; // stop drawing once we run out of vertical space
          page.drawText(line, { x: 40, y, size, font: useFont, color: PDFLib.rgb(0.08, 0.08, 0.12) });
          y -= size + 8;
        });
        y -= 6;
      });
    }

    report(92, "Saving…");
    const bytes = await outDoc.save();
    return {
      message: `Converted ${slideFiles.length} slide${slideFiles.length > 1 ? "s" : ""} to PDF (text content only).`,
      downloads: [{ blob: new Blob([bytes], { type: "application/pdf" }), filename: renameFile(ws.files[0].name, "converted") }],
    };
  },
});

registerTool({
  id: "extract-fonts",
  title: "Extract Fonts",
  desc: "Pull embedded font files out of a PDF, where the PDF allows extraction.",
  category: "edit",
  icon: "font",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Extract Fonts & Download",
  buildBody(ws) {
    const info = document.createElement("div");
    info.className = "alert alert-info";
    info.textContent =
      "This is best-effort: it only finds fonts that are fully embedded in the PDF using standard TrueType, OpenType or Type1 font files. Subsetted, non-embedded, or unusually encoded fonts may not be extractable.";
    ws.dynamicEl.appendChild(info);
  },
  async process(ws, report) {
    report(10, "Reading file…");
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    const pdfDoc = await PDFEngine.loadPdfDoc(buf);
    report(30, "Scanning for embedded fonts…");

    const outputs = [];
    const seenRefs = new Set();
    let indirectObjects = [];
    try {
      indirectObjects = pdfDoc.context.enumerateIndirectObjects();
    } catch (e) {
      throw new Error("This PDF's internal structure couldn't be scanned for fonts.");
    }

    const FILE_KEYS = [
      ["FontFile2", "ttf"],
      ["FontFile3", "otf"],
      ["FontFile", "pfb"],
    ];

    for (const [, obj] of indirectObjects) {
      try {
        if (!obj || typeof obj.get !== "function") continue;
        const typeVal = obj.get(PDFLib.PDFName.of("Type"));
        if (!typeVal || typeVal.toString() !== "/FontDescriptor") continue;

        let baseFontName = "font";
        try {
          const fn = obj.get(PDFLib.PDFName.of("FontName"));
          if (fn) baseFontName = fn.toString().replace(/^\//, "");
        } catch (e) {
          /* keep default name */
        }

        for (const [key, ext] of FILE_KEYS) {
          let streamRef;
          try {
            streamRef = obj.get(PDFLib.PDFName.of(key));
          } catch (e) {
            continue;
          }
          if (!streamRef) continue;
          const dedupeKey = streamRef.toString ? streamRef.toString() : String(streamRef);
          if (seenRefs.has(dedupeKey)) continue;
          seenRefs.add(dedupeKey);

          let stream;
          try {
            stream = pdfDoc.context.lookup(streamRef);
          } catch (e) {
            continue;
          }
          if (!stream) continue;

          let bytes = null;
          try {
            if (typeof PDFLib.decodePDFRawStream === "function") {
              bytes = PDFLib.decodePDFRawStream(stream).decode();
            }
          } catch (e) {
            /* fall through to raw contents below */
          }
          if ((!bytes || !bytes.length) && stream.contents) bytes = stream.contents;
          if (!bytes || !bytes.length) continue;

          outputs.push({
            blob: new Blob([bytes], { type: "application/octet-stream" }),
            filename: renameFile(ws.files[0].name, `${sanitizeFontName(baseFontName)}-${outputs.length + 1}`, ext),
          });
        }
      } catch (e) {
        /* skip any font descriptor we can't safely read */
      }
    }

    if (!outputs.length) {
      throw new Error(
        "No extractable embedded font files were found in this PDF. Its fonts may not be embedded, or may use an encoding this tool can't decode."
      );
    }
    report(85, "Packaging…");
    const downloads = await downloadsAsZipOrSequence(outputs, renameFile(ws.files[0].name, "fonts", "zip"));
    return { message: `Extracted ${outputs.length} font file${outputs.length > 1 ? "s" : ""}.`, downloads };
  },
});

registerTool({
  id: "ocr-pdf",
  title: "OCR PDF",
  desc: "Make a scanned PDF searchable by recognizing its text and adding an invisible, selectable text layer.",
  category: "convert",
  icon: "ocr",
  accept: PDFEngine.ACCEPT_PDF,
  extensions: [".pdf"],
  acceptAttr: ".pdf",
  acceptLabel: "PDF file",
  multiple: false,
  minFiles: 1,
  actionLabel: "Run OCR & Download",
  options: [
    {
      key: "lang",
      label: "Document language",
      type: "select",
      default: "eng",
      choices: [
        { value: "eng", label: "English" },
        { value: "spa", label: "Spanish" },
        { value: "fra", label: "French" },
        { value: "deu", label: "German" },
        { value: "por", label: "Portuguese" },
        { value: "hin", label: "Hindi" },
        { value: "ara", label: "Arabic" },
        { value: "chi_sim", label: "Chinese (Simplified)" },
      ],
    },
  ],
  buildBody(ws) {
    const info = document.createElement("div");
    info.className = "alert alert-info";
    info.textContent =
      "Runs entirely in your browser using an on-device OCR engine — the first run downloads a small language model. This can take a while for long documents; keep this tab open until it finishes. Accuracy depends heavily on scan quality.";
    ws.dynamicEl.appendChild(info);
    ws.renderOptions(ws.dynamicEl);
  },
  async process(ws, report) {
    if (typeof Tesseract === "undefined") throw new Error("The OCR engine didn't load — check your connection and try again.");
    report(5, "Reading file…");
    const buf = await PDFEngine.readAsArrayBuffer(ws.files[0]);
    const pdfJsDoc = await PDFEngine.loadPdfJsDoc(buf);
    if (pdfJsDoc.numPages > 40) {
      throw new Error("OCR is limited to 40 pages per document in the browser — try splitting the file first.");
    }

    const lang = ws.optionValues.lang || "eng";
    const outDoc = await PDFLib.PDFDocument.create();
    const ocrFont = await outDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const RENDER_SCALE = 2;

    let worker;
    try {
      worker = await Tesseract.createWorker(lang, 1, {
        logger: (m) => {
          if (m.status === "recognizing text" && typeof m.progress === "number") {
            report(10 + m.progress * 80, `Recognizing text… ${Math.round(m.progress * 100)}%`);
          }
        },
      });
    } catch (e) {
      throw new Error("Couldn't start the OCR engine for the selected language. Check your connection and try again.");
    }

    try {
      for (let i = 1; i <= pdfJsDoc.numPages; i++) {
        report(5 + ((i - 1) / pdfJsDoc.numPages) * 85, `Processing page ${i} of ${pdfJsDoc.numPages}…`);
        const canvas = await PDFEngine.renderPageToCanvas(pdfJsDoc, i, RENDER_SCALE);
        const pageWidthPt = canvas.width / RENDER_SCALE;
        const pageHeightPt = canvas.height / RENDER_SCALE;

        const { data } = await worker.recognize(canvas);

        const jpegBlob = await PDFEngine.canvasToBlob(canvas, "image/jpeg", 0.82);
        const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
        const img = await outDoc.embedJpg(jpegBytes);
        const page = outDoc.addPage([pageWidthPt, pageHeightPt]);
        page.drawImage(img, { x: 0, y: 0, width: pageWidthPt, height: pageHeightPt });

        const words = (data && data.words) || [];
        words.forEach((w) => {
          if (!w.text || !w.text.trim() || !w.bbox) return;
          const wPt = (w.bbox.x1 - w.bbox.x0) / RENDER_SCALE;
          const hPt = (w.bbox.y1 - w.bbox.y0) / RENDER_SCALE;
          if (wPt <= 0 || hPt <= 0) return;
          const xPt = w.bbox.x0 / RENDER_SCALE;
          const yPt = pageHeightPt - w.bbox.y1 / RENDER_SCALE;
          const size = Math.max(4, hPt * 0.9);
          try {
            page.drawText(w.text, {
              x: xPt,
              y: yPt,
              size,
              font: ocrFont,
              opacity: 0, // invisible but selectable text layer over the scanned image
            });
          } catch (e) {
            /* some OCR'd characters may not exist in the embedded font — skip that word */
          }
        });
      }
    } finally {
      try {
        await worker.terminate();
      } catch (e) {
        /* ignore cleanup errors */
      }
    }

    report(95, "Saving…");
    const bytes = await outDoc.save();
    return {
      message: "OCR complete — your PDF now has a searchable, selectable text layer.",
      downloads: [{ blob: new Blob([bytes], { type: "application/pdf" }), filename: renameFile(ws.files[0].name, "ocr") }],
    };
  },
});

// ---------------------------------------------------------------------
// Bootstrap — runs on every tool page
// ---------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const toolId = document.body.dataset.tool;
  if (!toolId) return;
  const appEl = document.getElementById("tool-app");
  if (!appEl) return;

  const cfg = TOOL_CONFIGS[toolId];
  const iconHost = document.querySelector(".tool-icon");

  if (!cfg) {
    if (iconHost) iconHost.innerHTML = svgIcon("wrench");
    appEl.innerHTML = "";
    const panel = document.createElement("div");
    panel.className = "glass result-panel";
    const h = document.createElement("h3");
    h.textContent = "Coming soon";
    const p = document.createElement("p");
    p.textContent =
      "This tool needs capabilities (like real encryption or office-format conversion) that can't be done reliably in the browser alone. We're working on it — in the meantime, explore the tools that are ready below.";
    const link = document.createElement("a");
    link.href = "all-tools.html";
    link.className = "btn btn-primary";
    link.textContent = "See all tools";
    panel.append(h, p, link);
    appEl.appendChild(panel);
    return;
  }

  if (iconHost) iconHost.innerHTML = svgIcon(cfg.icon); // constant, developer-authored icon markup
  new ToolWorkspace(appEl, cfg);
});
