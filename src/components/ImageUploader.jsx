import React, { useRef } from 'react';
import {generateUUID} from '../components/helps.js'


export default function ImageUploader({ onAdd }) {
  const fileInputRef = useRef();

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const imagePromises = fileArray.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            id: generateUUID,
            file,
            name: file.name,
            preview: reader.result,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(images => {
      onAdd(images);
    });
  };

  const handleInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = null; // para permitir volver a subir la misma imagen
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      className="border-2 border-dashed border-gray-400 p-6 rounded text-center cursor-pointer mb-4"
      onClick={() => fileInputRef.current.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <p className="text-gray-600">Haz clic o arrastra imágenes aquí</p>
      <input
        type="file"
        multiple
        accept="image/*"
        ref={fileInputRef}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}