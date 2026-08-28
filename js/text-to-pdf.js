"use strict";

(() => {
  const app = document.getElementById("text-to-pdf-app");
  if (!app || !window.jspdf || !window.html2canvas) return;
  const { jsPDF } = window.jspdf;
  const state = { images: [], selectedImage: null };

  app.innerHTML = `
    <div class="glass" style="padding:18px">
      <div class="option-group"><label for="ttp-text">Your text</label><textarea id="ttp-text" rows="8" dir="auto" placeholder="Type or paste your text here…\n\nEnglish • हिन्दी • বাংলা • العربية • 中文 • 日本語 • 한국어 • தமிழ் • తెలుగు • ગુજરાતી • मराठी • etc."></textarea></div>
      <div class="grid grid-4" style="margin-top:14px">
        <div class="option-group"><label for="ttp-size">Font size</label><select id="ttp-size"><option>12</option><option selected>14</option><option>16</option><option>18</option><option>20</option><option>24</option><option>28</option><option>32</option></select></div>
        <div class="option-group"><label for="ttp-font">Font</label><select id="ttp-font"><option value="system-ui, sans-serif" selected>System / Unicode</option><option value="Arial, sans-serif">Arial</option><option value="Georgia, serif">Georgia</option><option value="Verdana, sans-serif">Verdana</option><option value="monospace">Monospace</option></select></div>
        <div class="option-group"><label for="ttp-align">Alignment</label><select id="ttp-align"><option value="left" selected>Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justify</option></select></div>
        <div class="option-group"><label for="ttp-page">Page size</label><select id="ttp-page"><option value="a4" selected>A4</option><option value="letter">Letter</option><option value="a5">A5</option></select></div>
      </div>
      <div class="checkbox-row" style="margin-top:12px"><input id="ttp-bold" type="checkbox"><span>Bold text</span></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
        <label class="btn btn-secondary" style="cursor:pointer">📷 Add Photo<input id="ttp-image" type="file" accept="image/*" multiple hidden></label>
        <button id="ttp-delete-image" class="btn btn-secondary" type="button" disabled>Remove Selected Photo</button>
        <button id="ttp-download" class="btn btn-primary" type="button">Create PDF & Download</button>
        <button id="ttp-clear" class="btn btn-secondary" type="button">Clear</button>
      </div>
      <div class="alert alert-info" style="margin-top:14px">Add one or more photos, then <strong>drag each photo anywhere on the page</strong>. Tap a photo to select it and resize it with the control below. Photos and text are processed in your browser.</div>
      <div id="ttp-image-controls" style="display:none;margin-top:12px" class="option-group"><label for="ttp-image-size">Selected photo size</label><input id="ttp-image-size" type="range" min="80" max="650" value="260" style="width:100%"></div>
      <div style="margin-top:18px;overflow:auto;border-radius:14px;background:rgba(0,0,0,.04);padding:16px">
        <div style="min-width:620px;display:flex;justify-content:center">
          <div id="ttp-page-canvas" style="position:relative;width:595px;min-height:842px;background:#fff;color:#111;box-shadow:0 8px 28px rgba(0,0,0,.18);padding:54px;box-sizing:border-box;overflow:hidden">
            <div id="ttp-editor" contenteditable="true" dir="auto" style="min-height:734px;outline:none;white-space:pre-wrap;overflow-wrap:anywhere;font-family:system-ui,sans-serif;line-height:1.55;position:relative;z-index:1">Preview text</div>
          </div>
        </div>
      </div>
      <div id="ttp-status" class="hint" style="margin-top:12px" aria-live="polite"></div>
    </div>`;

  const text = document.getElementById("ttp-text");
  const size = document.getElementById("ttp-size");
  const font = document.getElementById("ttp-font");
  const align = document.getElementById("ttp-align");
  const bold = document.getElementById("ttp-bold");
  const editor = document.getElementById("ttp-editor");
  const page = document.getElementById("ttp-page-canvas");
  const imageInput = document.getElementById("ttp-image");
  const imageControls = document.getElementById("ttp-image-controls");
  const imageSize = document.getElementById("ttp-image-size");
  const deleteImage = document.getElementById("ttp-delete-image");
  const download = document.getElementById("ttp-download");
  const clear = document.getElementById("ttp-clear");
  const status = document.getElementById("ttp-status");

  function updateTextStyle() {
    editor.textContent = text.value || "Preview text";
    editor.style.fontSize = `${Number(size.value)}px`;
    editor.style.fontFamily = font.value;
    editor.style.textAlign = align.value;
    editor.style.fontWeight = bold.checked ? "700" : "400";
    editor.dir = "auto";
  }
  [text, size, font, align, bold].forEach((el) => el.addEventListener("input", updateTextStyle));
  updateTextStyle();

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function selectImage(item) {
    state.selectedImage = item;
    state.images.forEach((x) => { x.el.style.outline = x === item ? "2px solid #6C4CF0" : "none"; });
    imageControls.style.display = item ? "block" : "none";
    deleteImage.disabled = !item;
    if (item) imageSize.value = String(Math.round(item.width));
  }

  function makeDraggable(item) {
    const el = item.el;
    let active = false, sx = 0, sy = 0, ox = 0, oy = 0;
    el.addEventListener("pointerdown", (ev) => {
      ev.preventDefault(); ev.stopPropagation(); active = true;
      sx = ev.clientX; sy = ev.clientY; ox = item.x; oy = item.y; selectImage(item);
      try { el.setPointerCapture(ev.pointerId); } catch (_) {}
    });
    el.addEventListener("pointermove", (ev) => {
      if (!active) return;
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      item.x = clamp(ox + dx, 0, page.clientWidth - item.width);
      item.y = clamp(oy + dy, 0, Math.max(page.clientHeight, 842) - item.height);
      el.style.left = `${item.x}px`; el.style.top = `${item.y}px`;
    });
    const stop = () => { active = false; };
    el.addEventListener("pointerup", stop); el.addEventListener("pointercancel", stop);
  }

  function addImage(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const width = Math.min(260, img.width || 260);
        const height = Math.max(40, width * ((img.height || width) / (img.width || width)));
        const item = { x: clamp(165, 0, page.clientWidth - width), y: 160 + state.images.length * 25, width, height, el: null };
        const el = document.createElement("img");
        el.src = String(reader.result); el.alt = "Inserted photo"; el.draggable = false;
        el.style.cssText = `position:absolute;left:${item.x}px;top:${item.y}px;width:${item.width}px;height:auto;max-width:none;z-index:5;cursor:grab;border-radius:4px;touch-action:none;box-sizing:border-box;`;
        item.el = el; page.appendChild(el); state.images.push(item); makeDraggable(item); selectImage(item);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }
  imageInput.addEventListener("change", () => { Array.from(imageInput.files || []).forEach(addImage); imageInput.value = ""; });

  imageSize.addEventListener("input", () => {
    const item = state.selectedImage; if (!item) return;
    const ratio = item.height / item.width, w = Number(imageSize.value);
    item.width = w; item.height = w * ratio; item.x = clamp(item.x, 0, page.clientWidth - w);
    item.el.style.width = `${w}px`; item.el.style.left = `${item.x}px`; item.el.style.top = `${item.y}px`;
  });
  deleteImage.addEventListener("click", () => {
    const item = state.selectedImage; if (!item) return;
    item.el.remove(); state.images.splice(state.images.indexOf(item), 1); selectImage(null);
  });
  page.addEventListener("click", (ev) => { if (ev.target === page || ev.target === editor) selectImage(null); });
  clear.addEventListener("click", () => {
    text.value = ""; state.images.forEach((x) => x.el.remove()); state.images.length = 0; selectImage(null); updateTextStyle(); status.textContent = "";
  });

  download.addEventListener("click", async () => {
    if (!text.value.trim() && !state.images.length) { status.textContent = "Please enter text or add a photo first."; return; }
    download.disabled = true; status.textContent = "Creating your PDF…"; selectImage(null);
    try {
      const format = document.getElementById("ttp-page").value;
      const doc = new jsPDF({ unit: "pt", format, orientation: "p" });
      const pdfW = doc.internal.pageSize.getWidth(), pdfH = doc.internal.pageSize.getHeight();
      const pageW = page.clientWidth, pageH = Math.max(page.scrollHeight, 842), scale = pdfW / pageW;
      const canvas = await html2canvas(page, { scale: 2, backgroundColor: "#fff", useCORS: true, logging: false, width: pageW, height: pageH, windowWidth: pageW });
      const ratio = pdfW / pageW;
      let yPt = 0, remaining = pageH * ratio, first = true;
      while (remaining > 0.1) {
        if (!first) doc.addPage(); first = false;
        const slicePt = Math.min(pdfH, remaining), sourceY = Math.round((yPt / ratio) * 2), sourceH = Math.min(canvas.height - sourceY, Math.max(1, Math.round((slicePt / ratio) * 2)));
        const slice = document.createElement("canvas"); slice.width = canvas.width; slice.height = sourceH;
        const ctx = slice.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, slice.width, slice.height); ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, slice.width, sourceH);
        doc.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pdfW, slicePt);
        yPt += slicePt; remaining -= slicePt;
      }
      doc.save("text-to-pdf.pdf"); status.textContent = "PDF created successfully with your text and photos.";
    } catch (err) { console.error(err); status.textContent = "Could not create the PDF. Please try again."; }
    finally { download.disabled = false; }
  });
})();
