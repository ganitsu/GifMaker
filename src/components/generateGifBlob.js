import GIF from 'gif.js.optimized';

export function generateGifBlob(images, fps = 12, width = 200, height = 200) {
  return new Promise((resolve, reject) => {
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width,
      height,
      transparent: 0x00000000,
      workerScript: '/gif.worker.js',
    });

    let loadedCount = 0;

    images.forEach((image, index) => {
      const frame = document.createElement('img');
      frame.src = image.url;

      frame.onload = () => {
        gif.addFrame(frame, { delay: 1000 / fps, dispose: 2, transparent: 0x00FF00 });
        loadedCount++;

        if (loadedCount === images.length) {
          gif.render();
        }
      };

      frame.onerror = (err) => {
        console.error(`Error loading frame ${index}:`, err);
        reject(err);
      };
    });

    gif.on('finished', (blob) => {
      resolve(blob);
    });

    gif.on('error', (err) => {
      reject(err);
    });
  });
}
