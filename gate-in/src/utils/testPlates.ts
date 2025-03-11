export interface TestPlate {
  text: string;
  expectedType: string;
  expectedColor: 'BLACK' | 'RED' | 'YELLOW' | 'WHITE' | 'BLUE' | 'GREEN';
  description: string;
}

export const SAMPLE_PLATES: TestPlate[] = [
  // Regular regional plates
  {
    text: 'B 1234 ABC',
    expectedType: 'JAKARTA',
    expectedColor: 'BLACK',
    description: 'Standard Jakarta private vehicle'
  },
  {
    text: 'D 5678 XYZ',
    expectedType: 'BANDUNG',
    expectedColor: 'BLACK',
    description: 'Standard Bandung private vehicle'
  },

  // Special vehicles
  {
    text: 'RI 12',
    expectedType: 'GOVERNMENT',
    expectedColor: 'RED',
    description: 'Government vehicle'
  },
  {
    text: 'POL 123',
    expectedType: 'POLICE',
    expectedColor: 'RED',
    description: 'Police vehicle'
  },

  // Electric vehicles
  {
    text: 'B 789 DEF E',
    expectedType: 'ELECTRIC_PRIVATE',
    expectedColor: 'BLUE',
    description: 'Private electric vehicle'
  },
  {
    text: 'B 456 GHI E',
    expectedType: 'ELECTRIC_PUBLIC',
    expectedColor: 'YELLOW',
    description: 'Public electric vehicle'
  },

  // Test plates
  {
    text: 'STNA 1234',
    expectedType: 'TCKB_NEW',
    expectedColor: 'WHITE',
    description: 'New vehicle test plate'
  },
  {
    text: 'STLB 5678',
    expectedType: 'TCKB_USED',
    expectedColor: 'WHITE',
    description: 'Used vehicle test plate'
  },

  // Special purpose vehicles
  {
    text: 'B 234 JKL K',
    expectedType: 'CONSTRUCTION',
    expectedColor: 'YELLOW',
    description: 'Construction vehicle'
  },
  {
    text: 'B 567 MNO H',
    expectedType: 'HEAVY_EQUIPMENT',
    expectedColor: 'YELLOW',
    description: 'Heavy equipment vehicle'
  },

  // Public transportation
  {
    text: 'B 789 PQR T',
    expectedType: 'TAXI',
    expectedColor: 'YELLOW',
    description: 'Taxi'
  },
  {
    text: 'B 123 STU B',
    expectedType: 'BUS',
    expectedColor: 'YELLOW',
    description: 'Public bus'
  },

  // Tourism and rental
  {
    text: 'B 456 VWX R',
    expectedType: 'RENTAL',
    expectedColor: 'GREEN',
    description: 'Rental vehicle'
  },
  {
    text: 'B 789 YZA W',
    expectedType: 'TOURISM',
    expectedColor: 'GREEN',
    description: 'Tourism vehicle'
  }
]; 