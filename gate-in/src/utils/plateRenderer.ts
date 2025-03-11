import { PlateColor } from './colorDetection';

interface PlateRenderOptions {
  text: string;
  backgroundColor: PlateColor;
  width?: number;
  height?: number;
  noise?: number;
  rotation?: number;
  blur?: number;
}

const PLATE_COLORS = {
  BLACK: '#000000',
  RED: '#cc0000',
  YELLOW: '#ffcc00',
  WHITE: '#ffffff',
  BLUE: '#0066cc',
  GREEN: '#006633'
};

const TEXT_COLORS = {
  BLACK: '#ffffff',
  RED: '#ffffff',
  YELLOW: '#000000',
  WHITE: '#000000',
  BLUE: '#ffffff',
  GREEN: '#ffffff'
};

function addNoise(ctx: CanvasRenderingContext2D, amount: number): void {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * amount;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));     // Red
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise)); // Green
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise)); // Blue
  }

  ctx.putImageData(imageData, 0, 0);
}

function addBlur(ctx: CanvasRenderingContext2D, amount: number): void {
  ctx.filter = `blur(${amount}px)`;
  const temp = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.putImageData(temp, 0, 0);
  ctx.filter = 'none';
}

export function renderLicensePlate({
  text,
  backgroundColor,
  width = 400,
  height = 100,
  noise = 0,
  rotation = 0,
  blur = 0
}: PlateRenderOptions): ImageData {
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Apply rotation if specified
  if (rotation !== 0) {
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);
  }

  // Draw plate background
  ctx.fillStyle = PLATE_COLORS[backgroundColor];
  ctx.fillRect(0, 0, width, height);

  // Add border
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, width - 8, height - 8);

  // Draw text
  ctx.fillStyle = TEXT_COLORS[backgroundColor];
  ctx.font = 'bold 48px "License Plate"';
  if (!ctx.font.includes('License Plate')) {
    ctx.font = 'bold 48px Arial';
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Add text shadow for better contrast
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Draw text
  ctx.fillText(text, width / 2, height / 2);

  // Reset shadow
  ctx.shadowColor = 'transparent';

  // Add noise if specified
  if (noise > 0) {
    addNoise(ctx, noise);
  }

  // Add blur if specified
  if (blur > 0) {
    addBlur(ctx, blur);
  }

  // Return image data
  return ctx.getImageData(0, 0, width, height);
}

export function renderToDataURL(options: PlateRenderOptions): string {
  const canvas = document.createElement('canvas');
  canvas.width = options.width || 400;
  canvas.height = options.height || 100;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const imageData = renderLicensePlate(options);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
} 