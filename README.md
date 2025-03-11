# Parking Management System

A comprehensive parking management system with automated entry/exit gates, payment processing, and receipt generation.

## Project Structure

- `/admin` - Admin Dashboard application
- `/gate-in` - Entry Gate application
- `/gate-out` - Exit Gate application
- `/server` - Backend API server
- `/shared` - Shared utilities and types

## Features

- Real-time parking session management
- Automated entry and exit gates
- Dynamic rate calculation
- Payment processing
- Customizable receipt generation
- Batch receipt downloads
- Vehicle tracking
- User authentication
- Statistics and reporting

## Tech Stack

### Frontend
- React
- TypeScript
- Material-UI
- Redux Toolkit
- Socket.IO Client

### Backend
- Node.js
- Express
- TypeORM
- PostgreSQL
- Socket.IO

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/parking-system.git
cd parking-system
```

2. Install dependencies for each component:

```bash
# Server
cd server
npm install

# Admin Dashboard
cd ../admin
npm install

# Entry Gate
cd ../gate-in
npm install

# Exit Gate
cd ../gate-out
npm install
```

3. Set up environment variables:
Create a `.env` file in the server directory with the following content:

```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=parking_system

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Logging
LOG_LEVEL=info

# Hardware
ENTRY_GATE_PORT=COM3
EXIT_GATE_PORT=COM4
ENTRY_CAMERA_URL=rtsp://camera1.local
EXIT_CAMERA_URL=rtsp://camera2.local
```

4. Initialize the database:
```bash
cd server
npm run typeorm migration:run
npm run seed:rates
```

## Receipt System Setup

### Dependencies

Install the required packages for receipt generation:

```bash
cd server
npm install pdfkit @types/pdfkit xlsx @types/xlsx qrcode @types/qrcode jsbarcode @types/jsbarcode canvas @types/canvas archiver @types/archiver
```

### Usage

1. Generate a receipt:
```typescript
POST /api/receipts/generate/:parkingSessionId
Content-Type: application/json

{
  "customerEmail": "customer@example.com",
  "format": {
    "showLogo": true,
    "logoUrl": "https://example.com/logo.png",
    "companyName": "Parking Co.",
    "companyAddress": "123 Main St",
    "showVAT": true,
    "vatRate": 10,
    "currency": "USD",
    "locale": "en-US",
    "theme": {
      "primaryColor": "#1976d2",
      "fontSize": 12
    }
  }
}
```

2. Download receipts in batch:
```typescript
POST /api/receipts/batch-download
Content-Type: application/json

{
  "format": "pdf",
  "dateRange": {
    "start": "2024-03-01",
    "end": "2024-03-10"
  },
  "plateNumber": "ABC123",
  "vehicleType": "Car",
  "status": "paid",
  "sortBy": "date",
  "sortOrder": "desc",
  "receiptFormat": {
    "showLogo": true,
    "logoUrl": "https://example.com/logo.png",
    "companyName": "Parking Co.",
    "showVAT": true,
    "vatRate": 10
  }
}
```

### Receipt Customization Options

- Company Branding:
  - Logo
  - Company name and details
  - Custom colors and fonts
  - Social media links

- Content Options:
  - Barcode/QR code
  - VAT calculation
  - Multiple currencies
  - Custom date formats
  - Multiple languages

- Output Formats:
  - PDF with custom styling
  - Excel with formatted data
  - Batch downloads as ZIP

## Running the System

1. Start the server:
```bash
cd server
npm run dev
```

2. Start the admin dashboard:
```bash
cd admin
npm start
```

3. Start the entry gate:
```bash
cd gate-in
npm start
```

4. Start the exit gate:
```bash
cd gate-out
npm start
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 