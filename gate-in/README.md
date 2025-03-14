# Parking Gate Entry Application

A React-based application for managing vehicle entries at a parking facility. This application is part of the larger parking management system.

## Features

- License plate number entry with validation
- Automatic license plate detection using webcam
- Continuous auto-scanning mode
- Visual guide overlay for plate positioning
- Audio feedback for successful detection
- Vehicle type selection (Car, Motorcycle, Truck)
- Recent entries tracking
- Keyboard shortcuts for quick entry
- Offline support with local storage
- Real-time validation
- Success/error notifications
- Responsive design

## Camera Features

- Automatic license plate detection using OCR
- Continuous auto-scanning mode with configurable interval
- Visual guide overlay for optimal plate positioning
- Multiple camera support with camera switching
- Real-time confidence score display
- Audio feedback for successful detection
- Fallback to manual entry
- Support for both environment and user-facing cameras
- Automatic image capture and processing

## Auto-Scanning Mode

The application includes an advanced auto-scanning feature that:
- Continuously monitors the camera feed for license plates
- Provides visual guides for optimal plate positioning
- Automatically captures and processes plates when detected
- Gives audio feedback for successful detection
- Includes confidence scoring for detection accuracy
- Prevents duplicate scans with cooldown period
- Automatically switches to manual mode after successful detection

## Keyboard Shortcuts

- `Ctrl/Cmd + Enter`: Submit entry
- `Ctrl/Cmd + L`: Clear form
- `Alt + P`: Focus plate number input
- `Alt + 1`: Select Car
- `Alt + 2`: Select Motorcycle
- `Alt + 3`: Select Truck
- `Alt + C`: Toggle camera mode
- `Alt + S`: Toggle auto-scan mode

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with the following content:
   ```
   REACT_APP_API_URL=http://localhost:3001/api
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Environment Variables

- `REACT_APP_API_URL`: URL of the backend API
- `REACT_APP_VERSION`: Application version
- `REACT_APP_NAME`: Application name

## Development

### Project Structure

```
src/
  ├── components/     # React components
  │   ├── GateInScreen.tsx    # Main screen component
  │   ├── WebcamCapture.tsx   # Camera capture component
  │   └── RecentEntries.tsx   # Recent entries display
  ├── services/      # API and other services
  │   ├── api.ts     # Backend API integration
  │   └── ocr.ts     # OCR service integration
  ├── utils/         # Utility functions
  │   ├── validation.ts   # License plate validation
  │   └── shortcuts.ts    # Keyboard shortcuts
  ├── App.tsx        # Main application component
  └── index.tsx      # Application entry point
```

### Key Components

- `GateInScreen`: Main screen for vehicle entry
- `WebcamCapture`: Camera integration with OCR
- `RecentEntries`: Displays recent vehicle entries
- `ValidationUtils`: License plate validation
- `KeyboardShortcuts`: Keyboard shortcut handlers

## Camera Integration

The application uses the device's camera(s) for automatic license plate detection:

1. **Multiple Camera Support**
   - Automatically detects available cameras
   - Allows switching between cameras
   - Supports both built-in and external cameras

2. **OCR Integration**
   - Real-time license plate detection
   - Confidence score display
   - Error handling and fallback options

3. **User Experience**
   - Visual feedback during processing
   - Easy toggle between camera and manual input
   - Automatic mode switching after successful capture

## API Integration

The application communicates with the backend API for:
- Recording vehicle entries
- Validating entries
- Storing entry data
- Processing OCR requests

## Error Handling

- Input validation with immediate feedback
- API error handling with user-friendly messages
- Offline support with local storage
- Network error recovery
- Camera access error handling
- OCR processing error management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# Gate In - Sistem Parkir

Aplikasi Gate-In untuk sistem manajemen parkir dengan kemampuan offline.

## Fitur Utama

- **Pendaftaran Tiket Masuk Kendaraan**
- **Pengenalan Plat Nomor Otomatis (OCR)**
- **Koneksi Kamera IP**
- **Pencetakan Tiket Thermal**
- **Sinkronisasi Database & Server**
- **Mode Offline dengan Buffering**

## Offline Mode & Ketahanan Koneksi

Aplikasi ini dirancang untuk tetap berfungsi bahkan ketika koneksi server terputus.

### Fitur Offline Mode:

1. **Indikator Status Koneksi**:
   - Badge koneksi di navbar menunjukkan status online/offline
   - Menampilkan jumlah transaksi tertunda yang perlu disinkronkan

2. **Banner Status Offline**:
   - Muncul otomatis saat aplikasi kehilangan koneksi
   - Menampilkan durasi waktu offline
   - Tombol untuk mencoba terhubung kembali

3. **Buffering Transaksi**:
   - Menyimpan semua transaksi yang dilakukan saat offline di local storage
   - Transaksi akan otomatis disinkronkan saat koneksi tersedia kembali
   - Menggunakan antrian untuk memastikan urutan transaksi terjaga

4. **Fallback Port**:
   - Aplikasi akan otomatis mencoba beberapa port alternatif jika port utama tidak tersedia
   - Port yang dicoba: 5000 (default), 5001, 3000, 8080
   - Menggunakan strategi koneksi dengan exponential backoff

## Pengaturan

Untuk menjalankan aplikasi dengan port server yang berbeda, gunakan environment variable:

```
# Windows
set REACT_APP_SOCKET_URL=http://localhost:5001 && npm start

# Linux/Mac
REACT_APP_SOCKET_URL=http://localhost:5001 npm start
```

## Kelola Server Socket

Server socket dapat berjalan di port yang berbeda dengan:

```
# Windows
set PORT=5001 && node server/dist/index.js

# Linux/Mac
PORT=5001 node server/dist/index.js
```

## Saat Offline

Ketika aplikasi offline:
1. Semua operasi dicatat di local storage
2. UI menampilkan indikator offline dengan jumlah transaksi tertunda
3. Koneksi akan otomatis dicoba ulang dengan interval yang meningkat
4. Saat koneksi terhubung kembali, semua transaksi akan disinkronkan 