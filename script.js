window.addEventListener('load', () => {
    if (!window.deeplab) {
      console.error('Error: DeepLab no está cargado.');
      return;
    }
    init();
  });
  
  async function init() {
    const input = document.getElementById('file-input');
    const list = document.getElementById('file-list');
    const durationSlider = document.getElementById('duration-slider');
    const durationValue = document.getElementById('duration-value');
    const fpsSlider = document.getElementById('fps-slider');
    const fpsValue = document.getElementById('fps-value');
  
    const nextFrameBtn = document.getElementById('next-frame');
    const processSlider = document.getElementById('process-slider');
    const processValue = document.getElementById('process-value');
    const procCanvas = document.getElementById('proc-preview');
    const procCtx = procCanvas.getContext('2d');
  
    const display = document.getElementById('frame-display');
    const makeBtn = document.getElementById('make-gif');
  
    const deeplabModel = await window.deeplab.load({ base: 'pascal', quantizationBytes: 2 });
    console.log('DeepLab cargado');
  
    let files = [], order = [], currentSampled = [], activeIndex = 0, previewInterval;
  
    // Eventos UI
    input.addEventListener('change', () => {
      files = Array.from(input.files);
      order = files.map((_,i)=>i);
      renderList();
      updateSliders();
      startPreview();
    });
  
    durationSlider.addEventListener('input', () => {
      durationValue.textContent = durationSlider.value;
      updateSliders();
      startPreview();
    });
  
    fpsSlider.addEventListener('input', () => {
      fpsValue.textContent = fpsSlider.value;
      startPreview();
    });
  
    processSlider.addEventListener('input', () => {
      processValue.textContent = parseFloat(processSlider.value).toFixed(2);
      drawProcessed();  // re-procesa con nuevo parámetro
    });
  
    nextFrameBtn.addEventListener('click', () => {
      if (!currentSampled.length) return;
      activeIndex = Math.floor(Math.random() * currentSampled.length);
      drawProcessed();
    });
  
    // Drag & drop lista
    let dragIdx;
    list.addEventListener('dragstart', e => { dragIdx = +e.target.dataset.pos; });
    list.addEventListener('dragover', e => e.preventDefault());
    list.addEventListener('drop', e => {
      e.preventDefault();
      const dropIdx = +e.target.dataset.pos;
      if (dragIdx === dropIdx) return;
      const moved = order.splice(dragIdx,1)[0];
      order.splice(dropIdx,0,moved);
      renderList();
      startPreview();
    });
  
    function renderList() {
      list.innerHTML = '';
      order.forEach((fi,i) => {
        const li = document.createElement('li');
        li.draggable = true;
        li.textContent = files[fi].name;
        li.dataset.pos = i;
        list.appendChild(li);
      });
    }
  
    function updateSliders() {
      if (!files.length) return;
      const total = files.length;
      const duration = +durationSlider.value;
      const maxFps = Math.floor(total / duration) || 1;
      fpsSlider.max = maxFps;
      if (+fpsSlider.value > maxFps) fpsSlider.value = maxFps;
      fpsValue.textContent = fpsSlider.value;
    }
  
    function getSampledOrder() {
      const total = order.length;
      const fps = +fpsSlider.value;
      const duration = +durationSlider.value;
      const count = Math.min(total, Math.max(1, Math.floor(fps * duration)));
      const sc = [];
      for (let i = 0; i < count; i++) {
        sc.push(order[Math.floor(i * total / count)]);
      }
      return sc;
    }
  
    async function drawProcessed() {
      procCtx.clearRect(0, 0, procCanvas.width, procCanvas.height);
      if (!files.length || !deeplabModel || !currentSampled.length) return;
  
      const fi = currentSampled[activeIndex];
      const img = new Image();
      img.src = URL.createObjectURL(files[fi]);
      img.onload = async () => {
        // adaptar tamaño
        const w = procCanvas.width, h = procCanvas.height;
        // offscreen
        const tmp = document.createElement('canvas');
        tmp.width = img.width; tmp.height = img.height;
        const tctx = tmp.getContext('2d');
        tctx.drawImage(img, 0, 0);
  
        // segmentación
        const { segmentationMap } = await deeplabModel.segment(tmp);
        // cuenta clases
        const counts = {};
        segmentationMap.forEach(c => { if (c) counts[c] = (counts[c]||0) + 1; });
        const mainCls = +Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
  
        // dibujo base
        procCtx.drawImage(img, 0, 0, w, h);
        const imgd = procCtx.getImageData(0, 0, w, h);
        const d = imgd.data;
        const sx = img.width / w, sy = img.height / h;
        const alphaParam = +processSlider.value;
  
        // máscara
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const cls = segmentationMap[
              Math.floor(y * sy) * img.width + Math.floor(x * sx)
            ];
            if (cls !== mainCls) {
              // los píxels no principales ganan transparencia según parámetro
              d[(y*w + x)*4 + 3] = d[(y*w + x)*4 + 3] * alphaParam;
            }
          }
        }
        procCtx.putImageData(imgd, 0, 0);
      };
    }
  
    function startPreview() {
      clearInterval(previewInterval);
      if (!files.length) return;
      currentSampled = getSampledOrder();
      activeIndex = 0;
      drawProcessed();
      const fps = +fpsSlider.value;
      let i = 0;
      previewInterval = setInterval(() => {
        display.src = URL.createObjectURL(files[currentSampled[i]]);
        i = (i + 1) % currentSampled.length;
      }, 1000 / fps);
    }
  
    makeBtn.addEventListener('click', () => {
      if (!files.length) return;
      const fps = +fpsSlider.value;
      const sc = getSampledOrder();
      const gif = new GIF({ workers: 2, quality: 10, workerScript: './gif.worker.js' });
      let lc = 0;
      sc.forEach(idx => {
        const im = new Image();
        im.src = URL.createObjectURL(files[idx]);
        im.onload = () => {
          gif.addFrame(im, { delay: 1000 / fps });
          lc++;
          if (lc === sc.length) gif.render();
        };
      });
      gif.on('finished', blob => {
        const u = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = u;
        a.download = 'output.gif';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(u);
      });
    });
  }
  