import React, { useState } from 'react';


export default function Controls({ duration, setDuration, fps, setFps, totalImages, onGenerateGif }) {
  const [isDragging, setIsDragging] = useState(false);

    const handleDurationChange = (e) => {
        if (!isDragging) {
        setIsDragging(true);
        }
        setDuration(Number(e.target.value));
        setFps(Math.min(fps, totalImages/duration));
    };

  const handleFpsChange = (e) => {
    if (!isDragging) {
      setIsDragging(true);
    }
    setFps(Number(e.target.value));
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // Ahora que se ha dejado de mover la barra, se actualiza el canvas
      onGenerateGif(duration, fps, totalImages);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Slider Duración */}
      <div className="flex flex-col w-full">
        <label
          htmlFor="duration"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Duración: {duration}s
        </label>
        <input
          type="range"
          id="duration"
          min="1"
          max="10"
          step="0.01"
          value={duration}
          onChange={handleDurationChange}
          className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer"
        />
      </div>

      {/* Slider FPS */}
      <div className="flex flex-col w-full">
        <label
          htmlFor="fps"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          FPS: {fps}
        </label>
        <input
          type="range"
          id="fps"
          min="1"
          max={totalImages/duration}
          step="0.01"
          value={fps}
          onChange={handleFpsChange}
          className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer"
        />
      </div>

    </div>
  );

  
}
