import React, { useEffect, useRef, useState } from 'react';

export default function GifPreview({ images, duration, fps }) {
  const canvasRef = useRef(null);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length === 0) return;

    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    const img = new Image();
    img.src = images[frameIndex]?.preview || '';
    img.onload = () => {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(
        img,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    };
  }, [frameIndex, images]);

  
  useEffect(() => {
    if (!images || images.length === 0) return;

    const interval = 1000 / fps;
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images, fps]);

  return (
    <div className="flex justify-center items-center mt-4">
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className="border border-gray-300"
      />
    </div>
  );
}
