// Home.jsx
import React, { useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import ImageList from '../components/ImageList';
import Controls from '../components/Controls';
import GifPreview from '../components/GifPreview';
import ProcessedGifPreview from '../components/ProcessedGifPreview';
import { generateGifBlob } from '../components/generateGifBlob';
import { processImage } from '../components/processImage.jsx';
import {generateUUID, applyMask} from '../components/helps.js'
import './Home.css';
import ImageBrushEditor from '../components/ImageBrush.jsx';



export default function Home() {
  const [imageSize, setImageSize] = useState(128);
  const [images, setImages] = useState([]);
  const [duration, setDuration] = useState(5);
  const [fps, setFps] = useState(12);
  const [modelMap, setModelMap] = useState({});
  const [maskedImages, setmaskedImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [finalImages, setFinalImages] = useState([]);
  const [frameActual, setFrameActual] = useState(0)


  const setFpsFinal = (new_fps) => {
    getGifIndices();
    setFps(new_fps);
  }

  const handleAddImages = (newImages) => {
    const withIds = newImages.map((img) => ({
      ...img,
      id: generateUUID(),
      url: URL.createObjectURL(img.file),
    }));
    setImages(prev => [...prev, ...withIds]);
  };

  const handleReorder = (newOrder) => {
    setImages(newOrder);
  };

  const handleSelectModel = (imageId, model) => {
    setModelMap(prev => ({ ...prev, [imageId]: model }));
  };

  const getGifIndices = () => {
    let tempImages = [];
    
    if (Math.abs(images.length/duration - fps) < 0.05) {
      for (let i = 0; i < images.length; i++) {
        tempImages.push(images[i]);
      };
      setSelectedImages(tempImages);
      return tempImages;
    };
    
    const totalFrames = Math.floor(fps * duration);
    const step = Math.floor(images.length / totalFrames);

    for (let i = 0; i < totalFrames; i++) {
      tempImages.push(images[i * step] || images[images.length - 1]);
    }
    setSelectedImages(tempImages);
    return tempImages;
  };

  const handleGenerateGif = (duration, fps, totalImages) => {
    const selectedImages = getGifIndices();
    console.log("Imágenes seleccionadas para el GIF:", selectedImages);
  };

  const updateFinalImages = async (framesToUpdate = null) => {
    const updates = [];

    const totalFrames = maskedImages.length;
    const indices = framesToUpdate ?? [...Array(totalFrames).keys()];

    for (const i of indices) {
      const masked = maskedImages[i]?.url;
      const original = selectedImages[i]?.url;

      if (!masked || !original) continue;

      const canvas = await applyMask(original, masked);
      const dataUrl = canvas.toDataURL('image/png');

      updates[i] = {
        ...selectedImages[i],
        url: dataUrl,
        id: selectedImages[i].id || `${i}`, // conservar el id si lo hay
      };
    }

    // Fusionamos los updates con los no actualizados
    setFinalImages((prev) => {
      const result = [...prev];
      updates.forEach((item, i) => {
        if (item) result[i] = item;
      });
      return result;
    });
  };


  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }

  const downloadImage = async () => {
    try {
      // Cargo la primera original para saber tamaño real
      const firstOrig = await loadImage(selectedImages[0].url);
      const width = firstOrig.naturalWidth;
      const height = firstOrig.naturalHeight;

      // Canvas offscreen a tamaño completo
      const offCanvas = document.createElement('canvas');
      offCanvas.width = width;
      offCanvas.height = height;
      const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

      // Deshabilito suavizado de imagen (mantiene píxeles nítidos)
      offCtx.imageSmoothingEnabled = false;
      // offCtx.imageSmoothingQuality = 'low'; // opcional

      const frames = [];
      for (let i = 0; i < selectedImages.length; i++) {
        const [orig, mask] = await Promise.all([
          loadImage(selectedImages[i].url),
          loadImage(maskedImages[i].url),
        ]);

        // Dibujo original sin escalar
        offCtx.clearRect(0, 0, width, height);
        offCtx.drawImage(orig, 0, 0, orig.naturalWidth, orig.naturalHeight);

        // Aplico canal alfa desde la máscara
        const imageData = offCtx.getImageData(0, 0, width, height);
        const data = imageData.data;

        offCtx.clearRect(0, 0, width, height);
        offCtx.drawImage(mask, 0, 0, mask.naturalWidth, mask.naturalHeight);
        const maskData = offCtx.getImageData(0, 0, width, height).data;

        for (let j = 0; j < data.length; j += 4) {
          data[j + 3] = maskData[j]; 
        }
        offCtx.putImageData(imageData, 0, 0);

        // Extraigo dataURL en full quality
        frames.push({ url: offCanvas.toDataURL('image/png') });
      }

      const gifBlob = await generateGifBlob(frames, fps, width, height);
      const url = URL.createObjectURL(gifBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'processed.gif';
      a.click();
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error generando/descargando GIF:', err);
    }
  };






  const handleProcessImages = async () => {
    const selectedImages = getGifIndices();  // Solo las necesarias para el GIF
    const processed = [];

    try {
      for (const image of selectedImages) {
          const processedImageUrl = await processImage(image.file);
          processed.push({
            ...image,
            url: processedImageUrl
          });
        }
    } catch (error) {
      console.error('Error procesando imagen:', error);
    }
    console.log("Imagenes procesadas: ", selectedImages)

    setmaskedImages(processed);

    updateFinalImages();

  };


  const onEditComplete = (url) => {
    maskedImages[frameActual].url = url
  };
  

  const onChangeFrameRight = () => {
    setFrameActual((frameActual + 1)%selectedImages.length);
    console.log(frameActual);
  };

  const onChangeFrameLeft = () => {
    setFrameActual((frameActual + selectedImages.length-1)%selectedImages.length);
    console.log(frameActual);
  };

  return (
    <div className="w-full flex flex-col p-4 overflow-y-scroll scrollbar-none">
      <h1 className="text-xl font-bold mb-4">Creador de GIFs con fondo recortado</h1>
      <ImageUploader onAdd={handleAddImages} />

      <div className="container">
        <div className="image-list-container">
          <ImageList
            images={images}
            onReorder={handleReorder}
            onSelectModel={handleSelectModel}
            modelMap={modelMap}
            defaultModel="rembg-1.4"
            imageSize={imageSize}
          />
        </div>

        <div className="home-sidebar">
          <Controls
            duration={duration}
            setDuration={setDuration}
            fps={fps}
            setFps={setFpsFinal}
            totalImages={images.length}
            onGenerateGif={handleGenerateGif}
          />
          <GifPreview images={selectedImages} duration={duration} fps={fps} />

          <button onClick={handleProcessImages} className="mt-4 p-2 bg-blue-500 text-white">
            Procesar Imágenes
          </button>

          {maskedImages.length > 0 && (
            <ProcessedGifPreview images={maskedImages} original_images={images} fps={fps} />
          )}

          
          {maskedImages.length > 0 && (
            <ImageBrushEditor maskedImageUrl={maskedImages[frameActual]?.url} originalImageUrl={selectedImages[frameActual]?.url} onEditComplete={onEditComplete} onChangeFrameLeft={onChangeFrameLeft} onChangeFrameRight={onChangeFrameRight}/>
          )}
          
          <button onClick={downloadImage} className="mt-4 p-2 bg-blue-500 text-white">
            DESCARGAR RESULTADO
          </button>

        </div>
      </div>
    </div>
  );
}
