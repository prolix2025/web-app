// Handles image/PDF preview + zoom; keeps preview inside pane

(() => {
  const $ = (s) => document.querySelector(s);
  const fileInput = $('#file-input');
  const previewEmpty = $('#preview-empty');
  const imgEl = $('#preview-img');
  const canvas = $('#preview-canvas');
  const zoomInBtn = $('#zoom-in');
  const zoomOutBtn = $('#zoom-out');
  const dropZone = $('#preview-viewport');

  let pdfDoc = null;
  let pdfPage = 1;
  let scale = 1.0;
  const MIN_SCALE = 0.25;
  const MAX_SCALE = 4.0;
  const STEP = 0.15;

  const ctx = canvas.getContext('2d');

  const showEmpty = (b) => previewEmpty.style.display = b ? 'block' : 'none';
  const showImg   = (b) => imgEl.style.display = b ? 'block' : 'none';
  const showCanvas= (b) => canvas.style.display = b ? 'block' : 'none';

  function clearPreview() {
    showEmpty(true);
    showImg(false);
    showCanvas(false);
    imgEl.removeAttribute('src');
    imgEl.style.transform = '';
    imgEl.dataset.zoom = '1';
    pdfDoc = null;
  }

  function fitCanvas(viewport) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = Math.floor(viewport.width) + 'px';
    canvas.style.height = Math.floor(viewport.height) + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  async function renderPdfPage() {
    if (!pdfDoc) return;
    const page = await pdfDoc.getPage(pdfPage);
    const viewport = page.getViewport({ scale });
    fitCanvas(viewport);
    const renderContext = { canvasContext: ctx, viewport };
    await page.render(renderContext).promise;
  }

  async function openPdf(arrayBuffer) {
    pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    pdfPage = 1;
    showEmpty(false);
    showImg(false);
    showCanvas(true);
    await renderPdfPage();
  }

  function openImage(file) {
    const url = URL.createObjectURL(file);
    imgEl.onload = () => URL.revokeObjectURL(url);
    imgEl.src = url;
    imgEl.dataset.zoom = '1';
    imgEl.style.transformOrigin = 'top left';
    imgEl.style.transform = 'scale(1)';
    showEmpty(false);
    showCanvas(false);
    showImg(true);
  }

  // File input
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    scale = 1.0; // reset zoom per file

    const type = (file.type || '').toLowerCase();
    if (type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = async () => {
        try { await openPdf(reader.result); }
        catch (err) {
          console.error('PDF open error:', err);
          clearPreview();
          previewEmpty.innerHTML = '<p>Could not render PDF. Check PDF.js files & worker path.</p>';
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (type.startsWith('image/')) {
      openImage(file);
    } else {
      clearPreview();
      previewEmpty.innerHTML = '<p>Unsupported file type. Please upload an image or PDF.</p>';
    }
  });

  // Zoom controls
  zoomInBtn?.addEventListener('click', async () => {
    if (pdfDoc) {
      scale = Math.min(MAX_SCALE, scale + STEP);
      await renderPdfPage();
    } else if (imgEl.src) {
      const cur = parseFloat(imgEl.dataset.zoom || '1');
      const next = Math.min(MAX_SCALE, cur + STEP);
      imgEl.style.transform = `scale(${next})`;
      imgEl.dataset.zoom = String(next);
    }
  });

  zoomOutBtn?.addEventListener('click', async () => {
    if (pdfDoc) {
      scale = Math.max(MIN_SCALE, scale - STEP);
      await renderPdfPage();
    } else if (imgEl.src) {
      const cur = parseFloat(imgEl.dataset.zoom || '1');
      const next = Math.max(MIN_SCALE, cur - STEP);
      imgEl.style.transform = `scale(${next})`;
      imgEl.dataset.zoom = String(next);
    }
  });

  // Drag & drop
  if (dropZone) {
    const prevent = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
    ['dragenter','dragover','dragleave','drop'].forEach(evt =>
      dropZone.addEventListener(evt, prevent, false)
    );
    dropZone.addEventListener('dragenter', () => dropZone.classList.add('dragging'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
    dropZone.addEventListener('drop', (ev) => {
      dropZone.classList.remove('dragging');
      const file = ev.dataTransfer?.files?.[0];
      if (!file) return;
      fileInput.files = ev.dataTransfer.files;
      const changeEvent = new Event('change');
      fileInput.dispatchEvent(changeEvent);
    });
  }

  // Init
  clearPreview();
})();
