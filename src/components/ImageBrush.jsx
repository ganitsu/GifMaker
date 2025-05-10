import React, { useRef, useEffect, useState } from 'react';

const ImageBrushEditor = ({
  maskedImageUrl,
  originalImageUrl,
  onEditComplete,
  onChangeFrameLeft,
  onChangeFrameRight
}) => {
  const previewRef = useRef(null);
  const maskRef = useRef(null);
  const originalImgRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState('erase'); // 'erase' o 'restore'
  const [brushSize, setBrushSize] = useState(20);
  const [softness, setSoftness] = useState(0.5);
	const lastPosRef = useRef(null);


  useEffect(() => {
    const preview = previewRef.current;
    const maskC = maskRef.current;
    const mCtx = maskC.getContext('2d', { willReadFrequently: true });

    const img = new Image();
    const m = new Image();
    img.crossOrigin = 'Anonymous';
    m.crossOrigin = 'Anonymous';
    img.src = originalImageUrl;
    m.src = maskedImageUrl;

    img.onload = () => {
      preview.width = maskC.width = img.width;
      preview.height = maskC.height = img.height;
      mCtx.clearRect(0, 0, maskC.width, maskC.height);
      mCtx.drawImage(m, 0, 0);
      originalImgRef.current = img;
      updatePreview();
    };
  }, [originalImageUrl, maskedImageUrl]);

  const getPos = e => {
    const r = previewRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

		const handleDown = e => {
			e.preventDefault();
			const pos = getPos(e);
			setIsDrawing(true);
			setMode(e.button === 2 ? 'erase' : 'restore');
			lastPosRef.current = pos;
			drawBrushAt(pos.x, pos.y);
		};

	const handleMove = e => {
		if (!isDrawing) return;
		const pos = getPos(e);
		const last = lastPosRef.current;

		if (brushSize < 60 && last) {
			const dx = pos.x - last.x;
			const dy = pos.y - last.y;
			const dist = Math.hypot(dx, dy);
			const stepDistance = Math.max(brushSize * 0.3, 4);
			const MAX_STEPS = 30;
			const steps = Math.min(Math.ceil(dist / stepDistance), MAX_STEPS);
			for (let i = 0; i <= steps; i++) {
				const t = i / steps;
				const x = last.x + dx * t;
				const y = last.y + dy * t;
				drawBrushAt(x, y);
			}
		} else {
			drawBrushAt(pos.x, pos.y);
		}

		lastPosRef.current = pos;
	};

	const handleUp = () => {
		setIsDrawing(false);
		lastPosRef.current = null;
	};

  const drawBrushAt = (x, y) => {
    const ctx = maskRef.current.getContext('2d', { willReadFrequently: true });
    const r = brushSize / 2;
    const soft = Math.min(1, Math.max(0, softness));
    const inner = r * (1 - soft);
		if (!isFinite(x) || !isFinite(y)) return;

    ctx.globalCompositeOperation = 'source-over';

    let grad;
    if (soft > 0) {
      grad = ctx.createRadialGradient(x, y, inner, x, y, r);
      if (mode === 'erase') {
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
      } else {
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
      }
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = mode === 'erase' ? 'black' : 'white';
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();

    updatePreview();
  };

  const updatePreview = () => {
    const preview = previewRef.current;
    const maskC = maskRef.current;
    const pCtx = preview.getContext('2d', { willReadFrequently: true });
    const mCtx = maskC.getContext('2d', { willReadFrequently: true });

    const maskData = mCtx.getImageData(0, 0, maskC.width, maskC.height).data;
    const img = originalImgRef.current;
    if (!img) return;

    pCtx.clearRect(0, 0, preview.width, preview.height);
    pCtx.drawImage(img, 0, 0);

    const imgData = pCtx.getImageData(0, 0, preview.width, preview.height);
    for (let i = 0; i < maskData.length; i += 4) {
      imgData.data[i + 3] = maskData[i];
    }
    pCtx.putImageData(imgData, 0, 0);
  };

  const handleSave = () => {
    const dataUrl = maskRef.current.toDataURL('image/png');
    onEditComplete(dataUrl);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={previewRef}
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onContextMenu={e => e.preventDefault()}
        style={{ cursor: 'crosshair', border: '1px solid #ccc' }}
      />
      <canvas ref={maskRef} style={{ display: 'none' }} />

      <div style={{ marginTop: 8 }}>
        <label>
          Tamaño pincel:
          <input
            type="range"
            min={5}
            max={100}
            value={brushSize}
            onChange={e => setBrushSize(+e.target.value)}
          />
          {brushSize}px
        </label>
      </div>

      <div style={{ marginTop: 8 }}>
        <label>
          Suavidad:
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={softness}
            onChange={e => setSoftness(+e.target.value)}
          />
          {(softness * 100).toFixed(0)}%
        </label>
      </div>

      <div style={{ marginTop: 8 }}>
        <button onClick={onChangeFrameLeft}>← Frame anterior</button>
        <button onClick={onChangeFrameRight}>Frame siguiente →</button>
      </div>

      <div style={{ marginTop: 8 }}>
        <button onClick={handleSave}>Guardar Frame</button>
      </div>
    </div>
  );
};

export default ImageBrushEditor;
