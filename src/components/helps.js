import os from 'os';


let cachedIP = null;
let requestCount = 0;

function getLocalIP() {
  // Si ya se ha obtenido la IP, devolverla directamente
  if (cachedIP !== null && requestCount < 30) {
    requestCount++;
    return cachedIP;
  }

  // Si no, buscar la IP local y hacer cache de ella
  const interfaces = os.networkInterfaces();
  let ip = 'localhost'; // Fallback si no se encuentra una IP

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      const isIPv4 = net.family === 'IPv4' || net.family === 4;
      const isNotInternal = !net.internal;

      if (isIPv4 && isNotInternal) {
        ip = net.address;
        break;
      }
    }
  }

  // Almacenar la IP y resetear el contador
  cachedIP = ip;
  requestCount = 1;  // La primera vez después de obtener la IP

  return cachedIP;
}


const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
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

export {generateUUID, getLocalIP, applyMask};