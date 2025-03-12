import { createWorker } from 'tesseract.js';
import { OCR_CONFIG } from '../config/ocr';
import { preprocessImage } from '../utils/imageProcessing';
import { getDominantColor, PlateColor } from '../utils/colorDetection';
import { LRUCache } from '../utils/cache';

// Simplified Tesseract types
interface TesseractWorker {
  loadLanguage(lang: string): Promise<void>;
  initialize(lang: string): Promise<void>;
  setParameters(params: Record<string, any>): Promise<void>;
  recognize(image: string): Promise<{ data: { text: string; confidence: number } }>;
  terminate(): Promise<void>;
}

export interface OCRResult {
  text: string;
  confidence: number;
  plateType: string;
  color: PlateColor;
  description: string;
  isValid: boolean;
  validationErrors: string[];
  success?: boolean;
  plateNumber?: string;
  error?: string;
}

interface CacheEntry {
  result: OCRResult;
  timestamp: number;
}

const resultCache = new Map<string, CacheEntry>();

// Declare tesseractWorker variable
let tesseractWorker: TesseractWorker | null = null;

function cleanupCache() {
  const now = Date.now();
  Array.from(resultCache.entries()).forEach(([key, entry]) => {
    if (now - entry.timestamp > OCR_CONFIG.CACHE_EXPIRY) {
      resultCache.delete(key);
    }
  });
}

function convertToImageUrl(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

function identifyPlateType(text: string, detectedColor: PlateColor): { 
  plateType: string; 
  description: string; 
  expectedColor: PlateColor; 
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  let matchedType: string | null = null;
  let matchedConfig = null;

  // Clean the text for matching
  const cleanText = text.replace(/\s+/g, '').toUpperCase();

  // Check against all patterns
  for (const [type, config] of Object.entries(OCR_CONFIG.PLATE_PATTERNS)) {
    if (config.pattern.test(cleanText)) {
      matchedType = type;
      matchedConfig = config;
      break;
    }
  }

  if (!matchedType || !matchedConfig) {
    return {
      plateType: 'UNKNOWN',
      description: 'Unknown plate format',
      expectedColor: 'BLACK',
      isValid: false,
      errors: ['Invalid plate format']
    };
  }

  // Validate color
  if (detectedColor !== matchedConfig.expectedColor) {
    errors.push(`Invalid plate color: expected ${matchedConfig.expectedColor}, got ${detectedColor}`);
  }

  // Special validations for specific plate types
  if (matchedType.startsWith('ELECTRIC_')) {
    if (!cleanText.endsWith('E')) {
      errors.push('Electric vehicle plates must end with E');
    }
  } else if (matchedType.startsWith('TCKB_')) {
    if (!/^\d{4}$/.test(cleanText.slice(-4))) {
      errors.push('Test plate must end with 4 digits');
    }
  }

  return {
    plateType: matchedType,
    description: matchedConfig.description,
    expectedColor: matchedConfig.expectedColor,
    isValid: errors.length === 0,
    errors
  };
}

export async function detectLicensePlate(input: ImageData | string): Promise<OCRResult> {
  // Convert ImageData to data URL if needed
  const imageData = input instanceof ImageData ? convertToImageUrl(input) : input;

  // Check cache
  const cacheKey = imageData;
  const cached = resultCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < OCR_CONFIG.CACHE_EXPIRY) {
    return cached.result;
  }

  // Clean up old cache entries periodically
  cleanupCache();

  // Preprocess image
  const processedImage = await preprocessImage(imageData, OCR_CONFIG.PREPROCESSING);
  
  // Detect dominant color
  const dominantColor = await getDominantColor(processedImage);

  // Initialize Tesseract worker
  const worker = await createWorker() as unknown as TesseractWorker;
  
  try {
    await worker.loadLanguage(OCR_CONFIG.TESSERACT_LANG);
    await worker.initialize(OCR_CONFIG.TESSERACT_LANG);
    await worker.setParameters({
      tessedit_pageseg_mode: OCR_CONFIG.PSM_MODE,
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '
    });

    // Perform OCR
    const { data } = await worker.recognize(processedImage);
    const { text, confidence } = data;
    
    // Identify plate type and validate
    const { 
      plateType, 
      description, 
      expectedColor, 
      isValid, 
      errors 
    } = identifyPlateType(text, dominantColor);

    const ocrResult: OCRResult = {
      text: text.trim(),
      confidence,
      plateType,
      color: dominantColor,
      description,
      isValid: isValid && confidence >= OCR_CONFIG.MIN_CONFIDENCE_SCORE,
      validationErrors: errors
    };

    // Cache the result
    resultCache.set(cacheKey, {
      result: ocrResult,
      timestamp: Date.now()
    });

    return ocrResult;
  } finally {
    await worker.terminate();
  }
}

// Clean up worker when application closes
window.addEventListener('unload', async () => {
  if (tesseractWorker) {
    await tesseractWorker.terminate();
    tesseractWorker = null;
  }
}); 