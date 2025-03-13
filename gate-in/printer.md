# Panduan Konfigurasi Printer untuk Gate-In

Dokumen ini berisi panduan lengkap untuk menginstal dan mengkonfigurasi printer pada sistem Gate-In Parking Management System.

## 1. Persyaratan Hardware

### Rekomendasi Printer
- **Thermal Receipt Printer** (sangat direkomendasikan)
  - Epson TM-T88V, TM-T88VI, TM-T20II
  - Xprinter XP-58, XP-80
  - POS-58, POS-80 Series
- **Ukuran Kertas**: 58mm atau 80mm (lebih disukai)
- **Koneksi**: USB, Serial, atau Ethernet

### Persyaratan Minimal
- Printer yang mendukung ESC/POS command set
- Koneksi yang stabil ke komputer gate-in
- Driver printer yang kompatibel dengan sistem operasi

## 2. Lokasi Instalasi Driver

Driver printer **HARUS** diinstal pada **komputer gate-in** yang terhubung langsung dengan printer fisik, **bukan di server**.

## 3. Langkah-Langkah Instalasi Driver

### Untuk Windows

1. **Unduh Driver**
   - Kunjungi situs web resmi produsen printer
   - Cari driver yang sesuai dengan model printer dan versi Windows
   - Unduh installer driver (biasanya file .exe)

2. **Instalasi Driver**
   - Matikan printer terlebih dahulu
   - Jalankan installer yang telah diunduh
   - Ikuti instruksi wizard instalasi
   - Saat diminta, hubungkan printer ke komputer via USB/Serial
   - Hidupkan printer
   - Selesaikan proses instalasi
   - Restart komputer jika diperlukan

3. **Verifikasi Instalasi**
   - Buka "Control Panel" > "Devices and Printers"
   - Pastikan printer telah terdaftar dan statusnya "Ready"
   - **Penting**: Catat nama printer yang terdeteksi persis seperti yang ditampilkan di Windows

### Untuk Linux

1. **Instalasi Driver**
   - Untuk printer umum:
     ```bash
     sudo apt-get update
     sudo apt-get install cups printer-driver-escpos
     ```
   - Untuk driver spesifik:
     ```bash
     sudo apt-get install printer-driver-[nama-driver]
     ```

2. **Konfigurasi CUPS**
   - Buka browser dan akses: `http://localhost:631`
   - Pilih "Administration" > "Add Printer"
   - Pilih printer yang terdeteksi
   - Masukkan kredensial administrator saat diminta
   - Pilih driver yang sesuai
   - Catat nama printer persis seperti yang terdaftar di CUPS

## 4. Konfigurasi di Aplikasi Gate-In

### Pengaturan di file .env

Edit file `.env` di direktori gate-in dan tambahkan/perbarui konfigurasi printer:

```
# Printer Settings
REACT_APP_PRINTER_NAME="NamaPrinterTerdeteksi" # Gunakan nama persis seperti yang terdeteksi sistem
REACT_APP_PRINTER_TYPE="USB"                   # USB, SERIAL, atau NETWORK
REACT_APP_PRINTER_WIDTH=80                     # Ukuran kertas dalam mm (58 atau 80)
REACT_APP_PRINTER_DPI=200                      # Resolusi printer
REACT_APP_PRINTER_CHAR_PER_LINE=42             # Jumlah karakter per baris (tergantung ukuran kertas)
REACT_APP_PRINT_COPIES=1                       # Jumlah salinan tiket
```

### Untuk Serial Connection (jika menggunakan port COM)

```
REACT_APP_PRINTER_TYPE="SERIAL"
REACT_APP_PRINTER_PORT="COM3"                  # Sesuaikan dengan port COM yang digunakan
REACT_APP_PRINTER_BAUDRATE=9600                # Baudrate printer (biasanya 9600)
```

### Untuk Printer Jaringan

```
REACT_APP_PRINTER_TYPE="NETWORK"
REACT_APP_PRINTER_IP="192.168.1.100"           # IP Address printer
REACT_APP_PRINTER_PORT=9100                    # Port (biasanya 9100)
```

## 5. Instalasi Library Node.js untuk Printer Thermal

1. **Instal Dependensi**

```bash
cd gate-in
npm install node-thermal-printer escpos escpos-usb escpos-network --save
```

2. **Konfigurasi Printer SDK**

Tambahkan file konfigurasi printer di `src/services/printerService.ts`:

```typescript
import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';

export interface PrinterConfig {
  type: string;
  interface: string;
  options?: any;
}

export const getPrinterConfig = (): PrinterConfig => {
  const printerType = process.env.REACT_APP_PRINTER_TYPE || 'USB';
  const printerName = process.env.REACT_APP_PRINTER_NAME;
  
  let config: PrinterConfig = {
    type: PrinterTypes.EPSON,
    interface: ''
  };
  
  switch (printerType) {
    case 'USB':
      config.interface = `printer:${printerName}`;
      break;
    case 'SERIAL':
      const port = process.env.REACT_APP_PRINTER_PORT || 'COM1';
      const baudRate = parseInt(process.env.REACT_APP_PRINTER_BAUDRATE || '9600');
      config.interface = port;
      config.options = { baudRate };
      break;
    case 'NETWORK':
      const ip = process.env.REACT_APP_PRINTER_IP || '127.0.0.1';
      const netPort = parseInt(process.env.REACT_APP_PRINTER_PORT || '9100');
      config.interface = `tcp://${ip}:${netPort}`;
      break;
    default:
      config.interface = `printer:${printerName}`;
      break;
  }
  
  return config;
};

export const printTicket = async (ticketData: any): Promise<boolean> => {
  try {
    const config = getPrinterConfig();
    const printer = new ThermalPrinter(config);
    
    await printer.init();
    
    // Header
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println('TIKET PARKIR');
    printer.bold(false);
    printer.drawLine();
    
    // Ticket Data
    printer.alignLeft();
    printer.println(`Nomor Plat: ${ticketData.plateNumber}`);
    printer.println(`Jenis Kendaraan: ${getVehicleTypeName(ticketData.vehicleType)}`);
    printer.println(`Waktu Masuk: ${ticketData.entryTime}`);
    
    // Footer
    printer.drawLine();
    printer.alignCenter();
    printer.println('Simpan tiket ini dengan baik');
    printer.println('Tiket hilang akan dikenakan denda');
    
    // Cut paper
    printer.cut();
    
    await printer.execute();
    return true;
  } catch (error) {
    console.error('Printer error:', error);
    return false;
  }
};

const getVehicleTypeName = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'car': return 'Mobil';
    case 'motorcycle': return 'Motor';
    case 'truck': return 'Truk';
    default: return type;
  }
};
```

## 6. Pengujian dan Troubleshooting

### Pengujian Dasar
1. Pastikan printer terhubung dan diaktifkan
2. Jalankan aplikasi gate-in
3. Simulasikan kendaraan masuk
4. Verifikasi tiket tercetak dengan benar

### Troubleshooting

#### Printer Tidak Terdeteksi
- Periksa koneksi kabel (USB/Serial)
- Pastikan driver terinstal dengan benar
- Restart layanan spooler printer:
  ```
  net stop spooler
  net start spooler
  ```

#### Error Izin (Linux)
- Tambahkan user ke grup lp:
  ```bash
  sudo usermod -a -G lp username
  ```
- Berikan izin port:
  ```bash
  sudo chmod a+rw /dev/usb/lp0
  ```

#### Kualitas Cetak Buruk
- Periksa pengaturan DPI di konfigurasi
- Coba sesuaikan ukuran teks
- Bersihkan print head dengan cleaning kit

#### Error "Unable to open connection"
- Verifikasi nama printer persis sama dengan yang terdaftar di sistem
- Coba gunakan ID printer atau port spesifik sebagai pengganti nama
- Pastikan tidak ada aplikasi lain yang menggunakan printer

## 7. Rekomendasi Tambahan

### Pengelolaan Kertas dan Tinta
- Selalu sediakan kertas thermal cadangan
- Simpan kertas thermal di tempat sejuk dan kering
- Hindari paparan sinar matahari langsung pada kertas thermal

### Maintenance Rutin
- Bersihkan print head setiap 3-6 bulan
- Periksa kualitas cetak secara berkala
- Update driver saat tersedia versi baru

### Backup Plan
- Siapkan printer cadangan untuk situasi darurat
- Buat prosedur cetak manual jika sistem otomatis gagal

## 8. Referensi Driver

### Epson
- [Download Center Epson](https://epson.com/Support/sl/s)
- Driver model TM series: [Epson TM Series Drivers](https://download.epson-biz.com/?service=pos)

### Xprinter
- [Download Center Xprinter](http://www.xprintertech.com/download-center)

### Generic/Universal
- [CUPS Drivers (Linux)](https://www.cups.org/drivers.html)
- [ESC/POS Print Driver](https://github.com/mike42/escpos-php) 