"use strict";

(() => {
  const app = document.getElementById("text-to-pdf-app");
  if (!app || !window.jspdf) return;

  const { jsPDF } = window.jspdf;

  app.innerHTML = `
    <div class="glass" style="padding:20px">
      <div class="option-group">
        <label for="ttp-text">Your text</label>
        <textarea id="ttp-text" rows="14" dir="auto" placeholder="Type or paste your text here…&#10;&#10;English • हिन्दी • বাংলা • العربية • 中文 • 日本語 • 한국어 • தமிழ் • తెలుగు • ગુજરાતી • मराठी • etc."></textarea>
      </div>
      <div class="grid grid-4" style="margin-top:14px">
        <div class="option-group"><label for="ttp-size">Font size</label><select id="ttp-size"><option value="12">12</option><option value="14" selected>14</option><option value="16">16</option><option value="18">18</option><option value="20">20</option><option value="24">24</option></select></div>
        <div class="option-group"><label for="ttp-font">Font</label><select id="ttp-font"><option value="system-ui, sans-serif" selected>System / Unicode</option><option value="Arial, sans-serif">Arial</option><option value="Georgia, serif">Georgia</option><option value="Verdana, sans-serif">Verdana</option><option value="monospace">Monospace</option></select></div>
        <div class="option-group"><label for="ttp-align">Alignment</label><select id="ttp-align"><option value="left" selected>Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justify</option></select></div>
        <div class="option-group"><label for="ttp-page">Page size</label><select id="ttp-page"><option value="a4" selected>A4</option><option value="letter">Letter</option><option value="a5">A5</option></select></div>
      </div>
      <div class="checkbox-row" style="margin-top:12px">
        <input id="ttp-bold" type="checkbox"><span>Bold text</span>
      </div>
      <div class="alert alert-info" style="margin-top:14px">Text is processed in your browser. The editor uses the fonts available on your device/browser, so mixed-language text can be rendered without a server.</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
        <button id="ttp-download" class="btn btn-primary" type="button">Create PDF & Download</button>
        <button id="ttp-clear" class="btn btn-secondary" type="button">Clear</button>
      </div>
      <div id="ttp-status" class="hint" style="margin-top:12px" aria-live="polite"></div>
    </div>
    <div id="ttp-render" aria-hidden="true" style="position:fixed;left:-100000px;top:0;width:794px;background:#fff;color:#111;padding:76px;box-sizing:border-box;white-space:pre-wrap;overflow-wrap:anywhere;font-family:system-ui,sans-serif;line-height:1.55"></div>
  `;

  const text = document.getElementById("ttp-text");
  const size = document.getElementById("ttp-size");
  const font = document.getElementById("ttp-font");
  const align = document.getElementById("ttp-align");
  const pageSize = document.getElementById("ttp-page");
  const bold = document.getElementById("ttp-bold");
  const render = document.getElementById("ttp-render");
  const status = document.getElementById("ttp-status");

  function updatePreviewStyle() {
    render.textContent = text.value || "Preview text";
    render.style.fontSize = `${Number(size.value)}px`;
    render.style.fontFamily = font.value;
    render.style.textAlign = align.value;
    render.style.fontWeight = bold.checked ? "700" : "400";
    render.dir = "auto";
  }

  [text, size, font, align, bold].forEach((el) => el.addEventListener("input", updatePreviewStyle));
  updatePreviewStyle();

  document.getElementById("ttp-clear").addEventListener("click", () => {
    text.value = "";
    updatePreviewStyle();
    status.textContent = "";
  });

  document.getElementById("ttp-download").addEventListener("click", async () => {
    const value = text.value.trim();
    if (!value) {
      status.textContent = "Please enter some text first.";
      return;
    }

    const btn = document.getElementById("ttp-download");
    btn.disabled = true;
    status.textContent = "Creating your PDF…";
    updatePreviewStyle();

    try {
      const doc = new jsPDF({ unit: "pt", format: pageSize.value, orientation: "p" });
      const width = doc.internal.pageSize.getWidth();
      const margin = 54;

      await doc.html(render, {
        x: margin,
        y: margin,
        width: width - margin * 2,
        windowWidth: render.scrollWidth,
        autoPaging: "text",
        margin: 0,
        html2canvas: {
          scale: 1.5,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
        },
        callback: (pdf) => {
          pdf.save("text-to-pdf.pdf");
        },
      });

      status.textContent = "PDF created successfully.";
    } catch (err) {
      console.error(err);
      status.textContent = "Could not create the PDF. Please try again.";
    } finally {
      btn.disabled = false;
    }
  });
})();
