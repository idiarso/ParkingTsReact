export type PlateColor = 'BLACK' | 'RED' | 'YELLOW' | 'WHITE' | 'BLUE' | 'GREEN';

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

export async function getDominantColor(input: ImageData | string | Uint8ClampedArray): Promise<PlateColor> {
  let imageData: ImageData;

  if (input instanceof Uint8ClampedArray) {
    // Create ImageData from Uint8ClampedArray
    const size = Math.sqrt(input.length / 4);
    imageData = new ImageData(input, size, size);
  } else if (typeof input === 'string') {
    // Load image from URL
    imageData = await createImageData(input);
  } else {
    imageData = input;
  }

  const colorCounts: Record<PlateColor, number> = {
    BLACK: 0,
    RED: 0,
    YELLOW: 0,
    WHITE: 0,
    BLUE: 0,
    GREEN: 0
  };

  const data = imageData.data;
  let validPixels = 0;

  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const pixel: [number, number, number] = [data[i], data[i + 1], data[i + 2]];
    
    if (!isPixelBrightnessValid(pixel)) continue;
    
    validPixels++;
    
    for (const [color, range] of Object.entries(COLOR_RANGES)) {
      if (isPixelInRange(pixel, range)) {
        colorCounts[color as PlateColor]++;
        break;
      }
    }
  }

  // Find color with highest count
  let dominantColor: PlateColor = 'BLACK';
  let maxCount = 0;

  for (const [color, count] of Object.entries(colorCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantColor = color as PlateColor;
    }
  }

  // If no clear dominant color is found, default to BLACK
  if (maxCount / validPixels < 0.2) {
    return 'BLACK';
  }

  return dominantColor;
}

// Backward compatibility
export const detectPlateColor = async (imageUrl: string): Promise<PlateColor> => {
  return getDominantColor(imageUrl);
}; 