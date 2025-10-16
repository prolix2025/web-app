// util: clock the footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Elements
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

// --- Upload handlers (click, drop) ---
fileInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  handleFile(file);
});

// drag & drop
["dragenter", "dragover"].forEach(evt =>
  preview.addEventListener(evt, (e) => {
    e.preventDefault(); e.stopPropagation();
    preview.classList.add("dragging");
  })
);
["dragleave", "drop"].forEach(evt =>
  preview.addEventListener(evt, (e) => {
    e.preventDefault(); e.stopPropagation();
    preview.classList.remove("dragging");
  })
);
preview.addEventListener("drop", (e) => {
  const file = e.dataTransfer?.files?.[0];
  if (file) handleFile(file);
});

// --- Render & fake “extraction” (stub for your backend call) ---
function handleFile(file) {
  const type = file.type.toLowerCase();
  const isImage = type.includes("png") || type.includes("jpg") || type.includes("jpeg");
  const isPdf = type.includes("pdf");

  if (!isImage && !isPdf) {
    alert("Unsupported file. Try a PNG, JPG, or PDF.");
    return;
  }

  // show preview
  if (isImage) {
    previewImg.style.display = "block";
    previewCanvas.style.display = "none";
    const reader = new FileReader();
    reader.onload = () => { previewImg.src = reader.result; zoom = 1; };
    reader.readAsDataURL(file);
  } else if (isPdf) {
    // For now, just show a canvas placeholder for PDFs.
    previewImg.style.display = "none";
    previewCanvas.style.display = "block";
    drawPdfPlaceholder(file.name);
    zoom = 1;
  }

  // Stub: replace this section with a call to your Azure Function / API
  // to extract structured data, then update `info.textContent`.
  const fakeExtraction = {
    fileName: file.name,
    sizeKB: Math.round(file.size / 1024),
    type: file.type || "unknown",
    uploadedAt: new Date().toISOString(),
    sampleFields: {
      invoiceId: "INV-001234",
      vendor: "Contoso Ltd.",
      total: "$1,234.56",
      dueDate: "2025-11-30"
    }
  };
  info.textContent = JSON.stringify(fakeExtraction, null, 2);
}

function drawPdfPlaceholder(name) {
  const ctx = previewCanvas.getContext("2d");
  const w = Math.min(preview.clientWidth - 40, 900);
  const h = Math.max(420, Math.round(w * 1.3));
  previewCanvas.width = w;
  previewCanvas.height = h;

  ctx.fillStyle = "#0b0f17";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#122037";
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, w - 24, h - 24);

  ctx.fillStyle = "#9db7ff";
  ctx.font = "20px ui-sans-serif";
  ctx.fillText("PDF Preview Placeholder", 24, 44);

  ctx.fillStyle = "#8a9bbf";
  ctx.font = "14px ui-sans-serif";
  ctx.fillText(name, 24, 70);
}

// --- Actions ---
copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(info.textContent);
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1000);
  } catch {
    alert("Could not copy to clipboard.");
  }
});

clearBtn.addEventListener("click", () => {
  info.textContent = "— No document yet. Upload a file to see extracted fields here. —";
  previewImg.src = "";
  previewImg.style.display = "none";
  previewCanvas.style.display = "none";
});

zoomInBtn.addEventListener("click", () => setZoom(zoom + 0.1));
zoomOutBtn.addEventListener("click", () => setZoom(Math.max(0.2, zoom - 0.1)));

function setZoom(z) {
  zoom = z;
  if (previewImg.style.display === "block") {
    previewImg.style.transform = `scale(${zoom})`;
    previewImg.style.transformOrigin = "center center";
  } else if (previewCanvas.style.display === "block") {
    previewCanvas.style.transform = `scale(${zoom})`;
    previewCanvas.style.transformOrigin = "center center";
  }
}
