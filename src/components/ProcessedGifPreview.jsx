import React, { useRef, useState, useEffect } from 'react';
import { applyMask } from './helps';



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
