export interface ImageProcessingOptions {
  sharpen?: boolean;
  contrast?: boolean;
  grayscale?: boolean;
  threshold?: boolean;
}

export const preprocessImage = async (
  imageData: string,
  options: ImageProcessingOptions = {}
): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Load image
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageData;
  });

  // Set canvas dimensions
  canvas.width = img.width;
  canvas.height = img.height;

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Get image data
  const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageDataObj.data;

  // Apply grayscale if enabled
  if (options.grayscale) {
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;     // Red
      data[i + 1] = avg; // Green
      data[i + 2] = avg; // Blue
    }
  }

  // Apply contrast if enabled
  if (options.contrast) {
    const factor = 1.5; // Contrast factor
    for (let i = 0; i < data.length; i += 4) {
      data[i] = factor * (data[i] - 128) + 128;     // Red
      data[i + 1] = factor * (data[i + 1] - 128) + 128; // Green
      data[i + 2] = factor * (data[i + 2] - 128) + 128; // Blue
    }
  }

  // Apply threshold if enabled
  if (options.threshold) {
    const threshold = 128;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const value = avg > threshold ? 255 : 0;
      data[i] = value;     // Red
      data[i + 1] = value; // Green
      data[i + 2] = value; // Blue
    }
  }

  // Apply sharpening if enabled
  if (options.sharpen) {
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    const tempData = new Uint8ClampedArray(data);
    
    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * canvas.width + (x + kx)) * 4 + c;
              sum += tempData[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          const idx = (y * canvas.width + x) * 4 + c;
          data[idx] = Math.min(Math.max(sum, 0), 255);
        }
      }
    }
  }

  // Put processed image data back to canvas
  ctx.putImageData(imageDataObj, 0, 0);

  // Return processed image as base64
  return canvas.toDataURL('image/jpeg', 0.9);
}; 