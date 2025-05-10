import os from 'os';
import {getLocalIP} from '../components/helps.js'



export const processImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch('/process-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Error procesando la imagen');
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
