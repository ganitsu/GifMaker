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


export {generateUUID, getLocalIP};