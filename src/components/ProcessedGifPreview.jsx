import React, { useRef, useState, useEffect } from 'react';

// Helper que aplica una máscara a una imagen original
async function applyMask(originalUrl, maskUrl) {
  const [original, mask] = await Promise.all([
    loadImage(originalUrl),
    loadImage(maskUrl),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = original.width;
  canvas.height = original.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Dibujar imagen original
  ctx.drawImage(original, 0, 0);

  // Obtener datos de imagen
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const originalData = imageData.data;

  // Dibujar la máscara para leerla
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(mask, 0, 0);
  const maskData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  // Aplicar canal alfa desde la máscara
  for (let i = 0; i < originalData.length; i += 4) {
    originalData[i + 3] = maskData[i]; // rojo = gris = alfa
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

// Helper para cargar imagen como objeto Image
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

export default function ProcessedGifPreview({ images, original_images, fps }) {
  const canvasRef = useRef(null);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!images || !original_images || images.length === 0) return;

    const drawFrame = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      const maskedCanvas = await applyMask(
        original_images[frameIndex].url,
        images[frameIndex].url
      );

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(maskedCanvas, 0, 0, canvas.width, canvas.height);
    };

    drawFrame();
  }, [frameIndex, images, original_images]);

  useEffect(() => {
    if (!images || images.length === 0) return;
    const interval = 1000 / fps;
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images, fps]);

  return (
    <div className="flex flex-col items-center mt-4">
      <h2 className="mb-2">Vista previa del GIF procesado</h2>
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className="border border-gray-300"
      />
    </div>
  );
}
