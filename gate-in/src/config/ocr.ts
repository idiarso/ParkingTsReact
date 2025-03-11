import { ImageProcessingOptions } from '../utils/imageProcessing';
import { PlateColor } from '../utils/colorDetection';

interface PlateTypeConfig {
  pattern: RegExp;
  expectedColor: PlateColor;
  description: string;
}

export const OCR_CONFIG = {
  // Tesseract Configuration
  TESSERACT_LANG: 'eng',
  PSM_MODE: 7, // Single line mode
  MIN_CONFIDENCE_SCORE: 85, // Confidence threshold (0-100)

  // Scanning Settings
  SCAN_INTERVAL: 1000, // Milliseconds between scans
  COOLDOWN_PERIOD: 2000, // Milliseconds to wait after successful detection
  
  // Regular Expressions for Indonesian license plate formats with color validation
  PLATE_PATTERNS: {
    // Java regions
    JAKARTA: { pattern: /^B\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Jakarta' },
    BOGOR: { pattern: /^F\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Bogor' },
    TANGERANG: { pattern: /^A\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Banten' },
    BEKASI: { pattern: /^B\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Bekasi' },
    BANDUNG: { pattern: /^D\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Bandung' },
    CIREBON: { pattern: /^E\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Cirebon' },
    SEMARANG: { pattern: /^H\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Semarang' },
    PATI: { pattern: /^K\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Pati' },
    SURABAYA: { pattern: /^L\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Surabaya' },
    MALANG: { pattern: /^N\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Malang' },
    YOGYAKARTA: { pattern: /^AB\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Yogyakarta' },
    SURAKARTA: { pattern: /^AD\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Surakarta' },
    MADIUN: { pattern: /^AE\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Madiun' },
    KEDIRI: { pattern: /^AG\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Kediri' },

    // Sumatra regions
    ACEH: { pattern: /^BL\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Aceh' },
    MEDAN: { pattern: /^BK\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Medan' },
    PADANG: { pattern: /^BA\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Padang' },
    PALEMBANG: { pattern: /^BG\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Palembang' },
    LAMPUNG: { pattern: /^BE\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Lampung' },

    // Kalimantan regions
    PONTIANAK: { pattern: /^KB\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Pontianak' },
    SAMARINDA: { pattern: /^KT\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Samarinda' },
    BANJARMASIN: { pattern: /^DA\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Banjarmasin' },

    // Sulawesi regions
    MAKASSAR: { pattern: /^DD\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Makassar' },
    MANADO: { pattern: /^DB\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Manado' },

    // Other regions
    DENPASAR: { pattern: /^DK\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Denpasar' },
    AMBON: { pattern: /^DE\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Ambon' },
    JAYAPURA: { pattern: /^DS\s*\d{1,4}\s*[A-Z]{1,3}$/, expectedColor: 'BLACK', description: 'Jayapura' },

    // Special vehicles with updated colors
    GOVERNMENT: { pattern: /^RI\s*\d{1,4}$/, expectedColor: 'RED', description: 'Government Vehicle' },
    POLICE: { pattern: /^POL\s*\d{1,4}$/, expectedColor: 'RED', description: 'Police Vehicle' },
    MILITARY: { pattern: /^TNI\s*\d{1,4}$/, expectedColor: 'RED', description: 'Military Vehicle' },
    CORPS_DIPLOMATIC: { pattern: /^CD\s*\d{1,4}$/, expectedColor: 'RED', description: 'Diplomatic Corps' },

    // Electric Vehicles (New)
    ELECTRIC_PRIVATE: { 
      pattern: /^[A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{1,3}\s*E$/, 
      expectedColor: 'BLUE', 
      description: 'Private Electric Vehicle' 
    },
    ELECTRIC_PUBLIC: { 
      pattern: /^[A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{1,3}\s*E$/, 
      expectedColor: 'YELLOW', 
      description: 'Public Electric Vehicle' 
    },

    // Temporary Plates (New)
    TCKB_NEW: { 
      pattern: /^STN[A-Z]\s*\d{4}$/, 
      expectedColor: 'WHITE', 
      description: 'New Vehicle Test Plate' 
    },
    TCKB_USED: { 
      pattern: /^STL[A-Z]\s*\d{4}$/, 
      expectedColor: 'WHITE', 
      description: 'Used Vehicle Test Plate' 
    },

    // Special Purpose Vehicles (New)
    CONSTRUCTION: { 
      pattern: /^[A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{1,3}\s*K$/, 
      expectedColor: 'YELLOW', 
      description: 'Construction Vehicle' 
    },
    HEAVY_EQUIPMENT: { 
      pattern: /^[A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{1,3}\s*H$/, 
      expectedColor: 'YELLOW', 
      description: 'Heavy Equipment' 
    },

    // Public transportation with specific types
    PUBLIC_TRANSPORT: { 
      pattern: /^[A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{1,3}$/, 
      expectedColor: 'YELLOW', 
      description: 'Public Transport' 
    },
    TAXI: { 
      pattern: /^[A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{1,3}\s*T$/, 
      expectedColor: 'YELLOW', 
      description: 'Taxi' 
    },
    BUS: { 
      pattern: /^[A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{1,3}\s*B$/, 
      expectedColor: 'YELLOW', 
      description: 'Public Bus' 
    },

    // Rental/Tourism Vehicles (New)
    RENTAL: { 
      pattern: /^[A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{1,3}\s*R$/, 
      expectedColor: 'GREEN', 
      description: 'Rental Vehicle' 
    },
    TOURISM: { 
      pattern: /^[A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{1,3}\s*W$/, 
      expectedColor: 'GREEN', 
      description: 'Tourism Vehicle' 
    }
  } as Record<string, PlateTypeConfig>,

  // Image preprocessing options
  PREPROCESSING: {
    sharpen: true,
    contrast: true,
    grayscale: true,
    threshold: true,
  } as ImageProcessingOptions,

  // Cache settings
  CACHE_SIZE: 100, // Number of recent results to cache
  CACHE_EXPIRY: 1000 * 60 * 60, // Cache expiry time (1 hour)
}; 