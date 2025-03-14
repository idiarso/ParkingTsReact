import { detectLicensePlate, OCRResult } from '../services/ocr';
import { SAMPLE_PLATES, TestPlate } from './testPlates';
import { renderLicensePlate, renderToDataURL } from './plateRenderer';

interface TestVariation {
  noise: number;
  rotation: number;
  blur: number;
  description: string;
}

const TEST_VARIATIONS: TestVariation[] = [
  { noise: 0, rotation: 0, blur: 0, description: 'Clean' },
  { noise: 20, rotation: 0, blur: 0, description: 'With noise' },
  { noise: 0, rotation: 5, blur: 0, description: 'Slight rotation' },
  { noise: 0, rotation: 0, blur: 1, description: 'Slight blur' },
  { noise: 10, rotation: 3, blur: 0.5, description: 'Combined effects' }
];

export interface TestResult {
  plate: TestPlate;
  variation: TestVariation;
  result: OCRResult;
  passed: boolean;
  errors: string[];
  imageUrl: string;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  accuracy: number;
  variationResults: {
    variation: TestVariation;
    passed: number;
    total: number;
    accuracy: number;
  }[];
}

export async function testOCRSystem(): Promise<{
  results: TestResult[];
  summary: TestSummary;
}> {
  const results: TestResult[] = [];
  
  for (const plate of SAMPLE_PLATES) {
    for (const variation of TEST_VARIATIONS) {
      try {
        // Render plate with current variation
        const imageData = renderLicensePlate({
          text: plate.text,
          backgroundColor: plate.expectedColor,
          noise: variation.noise,
          rotation: variation.rotation,
          blur: variation.blur
        });

        // Convert ImageData to data URL
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        ctx?.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');

        // Perform OCR
        const result = await detectLicensePlate(dataUrl);

        // Validate results
        const errors: string[] = [];
        
        // Check plate type
        if (result.plateType !== plate.expectedType) {
          errors.push(`Type mismatch: expected ${plate.expectedType}, got ${result.plateType}`);
        }

        // Check color
        if (result.color !== plate.expectedColor) {
          errors.push(`Color mismatch: expected ${plate.expectedColor}, got ${result.color}`);
        }

        // Check text (ignoring spaces and case)
        const normalizedExpected = plate.text.replace(/\s+/g, '').toUpperCase();
        const normalizedResult = result.text.replace(/\s+/g, '').toUpperCase();
        if (normalizedResult !== normalizedExpected) {
          errors.push(`Text mismatch: expected ${plate.text}, got ${result.text}`);
        }

        results.push({
          plate,
          variation,
          result,
          passed: errors.length === 0,
          errors,
          imageUrl: dataUrl
        });
      } catch (error) {
        results.push({
          plate,
          variation,
          result: {
            text: '',
            confidence: 0,
            plateType: 'ERROR',
            color: 'BLACK',
            description: 'Error processing plate',
            isValid: false,
            validationErrors: [(error as Error).message]
          },
          passed: false,
          errors: [(error as Error).message],
          imageUrl: ''
        });
      }
    }
  }

  // Calculate summary
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  const accuracy = (passed / total) * 100;

  // Calculate per-variation results
  const variationResults = TEST_VARIATIONS.map(variation => {
    const variationTests = results.filter(r => r.variation === variation);
    const variationPassed = variationTests.filter(r => r.passed).length;
    return {
      variation,
      passed: variationPassed,
      total: variationTests.length,
      accuracy: (variationPassed / variationTests.length) * 100
    };
  });

  return {
    results,
    summary: {
      total,
      passed,
      failed,
      accuracy,
      variationResults
    }
  };
}

export function displayTestResults(testResults: Awaited<ReturnType<typeof testOCRSystem>>): void {
  console.group('OCR System Test Results');
  
  // Display summary
  console.log('\nSummary:');
  console.log(`Total tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Accuracy: ${testResults.summary.accuracy.toFixed(2)}%`);

  // Display detailed results
  console.group('\nDetailed Results:');
  testResults.results.forEach((result, index) => {
    console.group(`Test ${index + 1}: ${result.plate.description}`);
    console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Expected: ${result.plate.text} (${result.plate.expectedType}, ${result.plate.expectedColor})`);
    console.log(`Got: ${result.result.text} (${result.result.plateType}, ${result.result.color})`);
    if (result.errors.length > 0) {
      console.log('Errors:', result.errors);
    }
    console.groupEnd();
  });
  console.groupEnd();

  console.groupEnd();
} 