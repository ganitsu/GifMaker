// Import modern-rembg with bundled dependencies
import { removeBackground } from 'https://esm.sh/modern-rembg@0.1.2?bundle';

// URL to the U-2-Net model hosted on jsDelivr
const MODEL_URL = './models/u2netp.onnx';

const fileInput = document.getElementById('file-input');
const canvas = document.getElementById('output-canvas');
const ctx = canvas.getContext('2d');

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Create a blob URL for the uploaded image
  const inputUrl = URL.createObjectURL(file);

  try {
    // Remove background; specify full model URL and disable multithreading to avoid crossOriginIsolated issues
    const outputBlob = await removeBackground(inputUrl, {
      model: MODEL_URL,
      resolution: 320,
      ort: { numThreads: 1 }
    });
    
    // Create a blob URL for the output PNG
    const resultUrl = URL.createObjectURL(outputBlob);
    const img = new Image();
    img.src = resultUrl;
    await img.decode();

    // Resize canvas and draw the result
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.clearRect(0, 0, img.width, img.height);
    ctx.drawImage(img, 0, 0);

    // Clean up object URLs
    URL.revokeObjectURL(inputUrl);
    URL.revokeObjectURL(resultUrl);
  } catch (err) {
    console.error('Background removal failed:', err);
  }
});