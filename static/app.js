document.getElementById("year").textContent = new Date().getFullYear();

const fileInput = document.getElementById("file-input");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("preview-img");
const previewCanvas = document.getElementById("preview-canvas");
const info = document.getElementById("extracted-info");

const copyBtn = document.getElementById("copy-info");
const clearBtn = document.getElementById("clear-info");
const zoomInBtn = document.getElementById("zoom-in");
const zoomOutBtn = document.getElementById("zoom-out");

let zoom = 1;

fileInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (file) handleFile(file);
});

["dragenter", "dragover"].forEach(evt =>
  preview.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); })
);
preview.addEventListener("drop", (e) => {
  e.preventDefault(); e.stopPropagation();
  const file = e.dataTransfer?.files?.[0];
  if (file) handleFile(file);
});

async function handleFile(file) {
  const type = file.type.toLowerCase();
  const isImage = /png|jpg|jpeg/.test(type);
  const isPdf = /pdf/.test(type);
  if (!isImage && !isPdf) { alert("Unsupported file. Try PNG, JPG, or PDF."); return; }

  // Show preview
  if (isImage) {
    previewImg.style.display = "block";
    previewCanvas.style.display = "none";
    const reader = new FileReader();
    reader.onload = () => { previewImg.src = reader.result; zoom = 1; };
    reader.readAsDataURL(file);
  } else {
    previewImg.style.display = "none";
    previewCanvas.style.display = "block";
    drawPdfPlaceholder(file.name);
  }

  // Send to backend for extraction
  const form = new FormData();
  form.append("file", file);

  try {
    const res = await fetch("/api/extract", { method: "POST", body: form });
    const json = await res.json();
    info.textContent = JSON.stringify(json, null, 2);
  } catch (err) {
    info.textContent = "Extraction failed. " + err;
  }
}

function drawPdfPlaceholder(name) {
  const ctx = previewCanvas.getContext("2d");
  const w = Math.min(preview.clientWidth - 40, 900);
  const h = Math.max(420, Math.round(w * 1.3));
  previewCanvas.width = w; previewCanvas.height = h;
  ctx.fillStyle = "#0b0f17"; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#122037"; ctx.lineWidth = 2; ctx.strokeRect(12, 12, w - 24, h - 24);
  ctx.fillStyle = "#9db7ff"; ctx.font = "20px ui-sans-serif"; ctx.fillText("PDF Preview Placeholder", 24, 44);
  ctx.fillStyle = "#8a9bbf"; ctx.font = "14px ui-sans-serif"; ctx.fillText(name, 24, 70);
}

document.getElementById("copy-info").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(info.textContent); copyBtn.textContent = "Copied!"; setTimeout(()=>copyBtn.textContent="Copy", 900); }
  catch { alert("Could not copy to clipboard."); }
});

clearBtn.addEventListener("click", () => {
  info.textContent = "— No document yet. Upload a file to see extracted fields here. —";
  previewImg.src = ""; previewImg.style.display = "none"; previewCanvas.style.display = "none";
});

zoomInBtn.addEventListener("click", () => setZoom(zoom + 0.1));
zoomOutBtn.addEventListener("click", () => setZoom(Math.max(0.2, zoom - 0.1)));

function setZoom(z) {
  zoom = z;
  const el = previewImg.style.display === "block" ? previewImg : previewCanvas;
  el.style.transform = `scale(${zoom})`;
  el.style.transformOrigin = "center center";
}
