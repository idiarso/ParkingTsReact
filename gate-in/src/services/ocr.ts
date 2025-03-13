import { createWorker } from 'tesseract.js';
import { validateLicensePlate } from '../utils/validation';
import { OCRResult } from '../types/ocr';

// Simplified Tesseract types
interface TesseractWorker {
  loadLanguage(lang: string): Promise<void>;
  initialize(lang: string): Promise<void>;
  setParameters(params: Record<string, any>): Promise<void>;
  recognize(image: string): Promise<{ data: { text: string; confidence: number } }>;
  terminate(): Promise<void>;
}

export async function detectLicensePlate(imageSrc: string): Promise<OCRResult> {
  try {
    const worker = await createWorker({
      logger: m => console.log(m)
    });
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const result = await worker.recognize(imageSrc);
    await worker.terminate();

    const text = result.data.text.trim().toUpperCase();
    const confidence = result.data.confidence;
    const isValid = validateLicensePlate(text);

    return {
      text,
      confidence,
      isValid
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to process image');
  }
}