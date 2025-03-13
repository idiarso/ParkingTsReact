export type PlateColor = 'BLACK' | 'WHITE' | 'YELLOW' | 'RED' | 'GREEN' | 'BLUE';

interface ColorRange {
  min: [number, number, number];
  max: [number, number, number];
}

export const COLOR_RANGES: Record<PlateColor, ColorRange> = {
  BLACK: {
    min: [0, 0, 0],
    max: [50, 50, 50]
  },
  RED: {
    min: [150, 0, 0],
    max: [255, 60, 60]
  },
  YELLOW: {
    min: [200, 150, 0],
    max: [255, 255, 60]
  },
  WHITE: {
    min: [200, 200, 200],
    max: [255, 255, 255]
  },
  BLUE: {
    min: [0, 0, 150],
    max: [60, 60, 255]
  },
  GREEN: {
    min: [0, 150, 0],
    max: [60, 255, 60]
  }
};

function isPixelInRange(pixel: [number, number, number], range: ColorRange): boolean {
  return pixel[0] >= range.min[0] && pixel[0] <= range.max[0] &&
         pixel[1] >= range.min[1] && pixel[1] <= range.max[1] &&
         pixel[2] >= range.min[2] && pixel[2] <= range.max[2];
}

function isPixelBrightnessValid(pixel: [number, number, number]): boolean {
  const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
  return brightness > 20 && brightness < 235; // Ignore very dark and very light pixels
}

function createImageData(imageUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, img.width, img.height));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

export async function getDominantColor(imageData: string | ImageData): Promise<PlateColor> {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Load image
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = typeof imageData === 'string' ? imageData : convertImageDataToUrl(imageData);
  });

  // Draw image to canvas
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  // Get pixel data
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  
  // Calculate average RGB
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  
  const pixels = data.length / 4;
  r = Math.round(r / pixels);
  g = Math.round(g / pixels);
  b = Math.round(b / pixels);

  // Determine dominant color
  const brightness = (r + g + b) / 3;
  const threshold = 128;

  if (brightness < threshold * 0.5) return 'BLACK';
  if (brightness > threshold * 1.5) return 'WHITE';
  
  // Check for specific colors
  if (r > g + b) return 'RED';
  if (g > r + b) return 'GREEN';
  if (b > r + g) return 'BLUE';
  if (r > threshold && g > threshold && b < threshold) return 'YELLOW';
  
  return 'BLACK';
}

function convertImageDataToUrl(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0);
  
  return canvas.toDataURL();
}

// Backward compatibility
export const detectPlateColor = async (imageUrl: string): Promise<PlateColor> => {
  return getDominantColor(imageUrl);
}; 