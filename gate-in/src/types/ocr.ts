import { PlateColor } from '../utils/colorDetection';

export interface OCRResult {
  text: string;
  confidence: number;
  isValid: boolean;
  plateType?: string;
  color?: PlateColor;
  description?: string;
  validationErrors?: string[];
  success?: boolean;
  plateNumber?: string;
  error?: string;
} 