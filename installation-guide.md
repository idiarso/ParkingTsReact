# Panduan Instalasi Sistem Parkir

## Daftar Isi
1. [Arsitektur Sistem](#arsitektur-sistem)
2. [Persyaratan Sistem](#persyaratan-sistem)
3. [Konfigurasi Jaringan](#konfigurasi-jaringan)
4. [Langkah-langkah Instalasi](#langkah-langkah-instalasi)
   - [Server dan Admin](#server-dan-admin)
   - [Gate Masuk (Gate-In)](#gate-masuk-gate-in)
   - [Gate Keluar (Gate-Out)](#gate-keluar-gate-out)
5. [Pengujian Sistem](#pengujian-sistem)
6. [Pemecahan Masalah](#pemecahan-masalah)
7. [Pemeliharaan](#pemeliharaan)

## Arsitektur Sistem

Sistem Parkir terdiri dari 3 komponen utama yang diinstal pada 3 komputer berbeda:

1. **Server & Admin** - Pusat pengelolaan data dan administrasi
2. **Gate-In** - Pintu masuk parkir dengan kamera dan pengendali palang
3. **Gate-Out** - Pintu keluar parkir dengan kamera, pemindai tiket, dan pengendali palang

Ketiga komponen ini terhubung dalam satu jaringan dan berkomunikasi melalui WebSocket untuk operasi real-time.

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Server & Admin ├──────┤     Gate-In     │      │    Gate-Out     │
│                 │      │                 │      │                 │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                          ┌───────┴───────┐
                          │   Database    │
                          │ (PostgreSQL)  │
                          └───────────────┘
```

## Persyaratan Sistem

### Untuk Semua Komputer
- Sistem Operasi: Windows 10/11
- Node.js v14 atau lebih tinggi
- Git
- Memori RAM minimal 4GB
- Koneksi jaringan LAN

### Khusus Server & Admin
- PostgreSQL 12 atau lebih tinggi
- Penyimpanan minimal 100GB
- Prosesor i5 generasi ke-8 atau setara

### Khusus Gate-In
- Kamera webcam atau IP camera
- Penghubung relay untuk pengendali palang
- Koneksi untuk lampu indikator

### Khusus Gate-Out
- Pemindai barcode/QR code
- Kamera verifikasi
- Printer termal untuk struk
- Penghubung relay untuk pengendali palang

## Konfigurasi Jaringan

Semua komputer harus berada dalam jaringan yang sama dan dapat saling berkomunikasi. Berikut konfigurasi yang direkomendasikan:

1. Server & Admin: IP statis (contoh: 192.168.1.10)
2. Gate-In: IP statis (contoh: 192.168.1.20)
3. Gate-Out: IP statis (contoh: 192.168.1.30)

Port yang perlu dibuka:
- 5000: API Server
- 8080: WebSocket Server
- 3000: Admin UI
- 3001: Gate-In UI
- 3002: Gate-Out UI

## Langkah-langkah Instalasi

### Server dan Admin

1. **Persiapan**
   - Pastikan PostgreSQL sudah terinstal dan berjalan
   - Buat database baru bernama `parking_system`

2. **Instalasi**
   - Ekstrak file `parking-system-admin.zip`
   - Jalankan `install-admin.bat`
   - Ikuti petunjuk yang muncul

3. **Konfigurasi**
   - Buka file `.env` di folder `server`
   - Sesuaikan parameter database:
     ```
     DB_HOST=localhost
     DB_PORT=5432
     DB_USERNAME=postgres
     DB_PASSWORD=your_password
     DB_NAME=parking_system
     ```
   - Sesuaikan parameter server:
     ```
     PORT=5000
     NODE_ENV=production
     WEBSOCKET_PORT=8080
     ```

4. **Menjalankan Server**
   - Buka Command Prompt sebagai Administrator
   - Navigasi ke folder server: `cd server`
   - Jalankan: `npm run start`

5. **Menjalankan Admin**
   - Buka Command Prompt baru sebagai Administrator
   - Navigasi ke folder admin: `cd admin`
   - Jalankan: `npm run start`
   - Akses Admin UI di browser: `http://localhost:3000`

### Gate Masuk (Gate-In)

1. **Persiapan**
   - Pastikan kamera terpasang dan berfungsi
   - Siapkan koneksi ke pengendali palang

2. **Instalasi**
   - Ekstrak file `parking-system-gate-in.zip`
   - Jalankan `install-gate-in.bat`
   - Ikuti petunjuk yang muncul

3. **Konfigurasi**
   - Buka file `.env` di folder `gate-in`
   - Sesuaikan alamat server:
     ```
     REACT_APP_API_URL=http://192.168.1.10:5000
     REACT_APP_WEBSOCKET_URL=ws://192.168.1.10:8080
     ```
   - Sesuaikan konfigurasi kamera:
     ```
     REACT_APP_CAMERA_TYPE=webcam  # atau 'ip' untuk IP Camera
     REACT_APP_CAMERA_IP=192.168.1.100  # jika menggunakan IP Camera
     REACT_APP_CAMERA_USERNAME=admin  # jika diperlukan
     REACT_APP_CAMERA_PASSWORD=admin  # jika diperlukan
     ```

4. **Menjalankan Aplikasi**
   - Buka Command Prompt sebagai Administrator
   - Navigasi ke folder gate-in: `cd gate-in`
   - Jalankan: `npm run start`
   - Aplikasi akan terbuka di browser

5. **Mode Produksi (Opsional)**
   - Untuk mode produksi, build aplikasi: `npm run build`
   - Instal serve: `npm install -g serve`
   - Jalankan aplikasi: `serve -s build -l 3001`

### Gate Keluar (Gate-Out)

1. **Persiapan**
   - Pastikan pemindai barcode terpasang dan berfungsi
   - Pastikan printer termal terpasang dan berfungsi
   - Siapkan koneksi ke pengendali palang

2. **Instalasi**
   - Ekstrak file `parking-system-gate-out.zip`
   - Jalankan `install-gate-out.bat`
   - Ikuti petunjuk yang muncul

3. **Konfigurasi**
   - Buka file `.env` di folder `gate-out`
   - Sesuaikan alamat server:
     ```
     REACT_APP_API_URL=http://192.168.1.10:5000
     REACT_APP_WEBSOCKET_URL=ws://192.168.1.10:8080
     ```
   - Sesuaikan konfigurasi printer:
     ```
     REACT_APP_PRINTER_NAME=POS58  # Nama printer termal
     ```

4. **Menjalankan Aplikasi**
   - Buka Command Prompt sebagai Administrator
   - Navigasi ke folder gate-out: `cd gate-out`
   - Jalankan: `npm run start`
   - Aplikasi akan terbuka di browser

5. **Mode Produksi (Opsional)**
   - Untuk mode produksi, build aplikasi: `npm run build`
   - Instal serve: `npm install -g serve`
   - Jalankan aplikasi: `serve -s build -l 3002`

## Pengujian Sistem

Setelah instalasi selesai, lakukan pengujian komprehensif:

1. **Uji Konektivitas**
   - Cek apakah Gate-In dan Gate-Out dapat terhubung ke Server
   - Pastikan WebSocket berfungsi (status koneksi di UI)

2. **Uji Fungsional Gate-In**
   - Pastikan kamera dapat mendeteksi plat nomor
   - Cek palang dapat terbuka dan tertutup dengan benar
   - Verifikasi data kendaraan masuk tercatat di database

3. **Uji Fungsional Gate-Out**
   - Pastikan pemindai barcode berfungsi
   - Cek perhitungan biaya parkir akurat
   - Pastikan struk dapat dicetak
   - Verifikasi palang dapat terbuka dan tertutup dengan benar

4. **Uji Admin**
   - Pastikan seluruh menu berfungsi
   - Cek laporan dapat dihasilkan dengan benar
   - Uji pencarian data kendaraan

## Pemecahan Masalah

### Masalah Koneksi WebSocket
- **Gejala**: Status "Disconnected" di aplikasi Gate
- **Solusi**: 
  - Cek apakah server WebSocket berjalan: `netstat -an | findstr 8080`
  - Pastikan firewall tidak memblokir port 8080
  - Restart server WebSocket

### Masalah Database
- **Gejala**: Error "Cannot connect to database" di log server
- **Solusi**:
  - Pastikan PostgreSQL berjalan: `services.msc` dan cek status PostgreSQL
  - Verifikasi kredensial database di file `.env`

### Masalah Kamera
- **Gejala**: Kamera tidak terdeteksi atau gambar tidak muncul
- **Solusi**:
  - Periksa device kamera di Device Manager
  - Pastikan browser mendapat izin akses kamera
  - Jika menggunakan IP Camera, cek koneksi jaringan ke kamera

### Masalah Printer
- **Gejala**: Struk tidak tercetak
- **Solusi**:
  - Cek status printer di Devices and Printers
  - Pastikan printer termal diset sebagai default
  - Verifikasi driver printer terinstal dengan benar

## Pemeliharaan

### Backup Database
Lakukan backup database secara berkala:
```
pg_dump -U postgres -d parking_system > backup_$(date +%Y%m%d).sql
```

### Update Sistem
Untuk update sistem:
1. Matikan semua aplikasi yang berjalan
2. Pull perubahan dari repository: `git pull`
3. Install dependencies baru jika ada: `npm install`
4. Build aplikasi kembali: `npm run build`
5. Jalankan migrasi database jika diperlukan
6. Restart aplikasi

### Pembersihan Log
Bersihkan file log secara berkala untuk menghemat ruang penyimpanan:
```
cd server/logs
del /q *.log
```

---

Untuk bantuan lebih lanjut, hubungi tim support di support@parkingsystem.com atau telepon (021) 123-4567. 