# Authentication and Workflow Guide for Parking System

This guide provides step-by-step instructions for operating the parking system, including authentication procedures and workflows for vehicle entry and exit.

## Instalasi dan Persiapan Sistem

### Persyaratan Sistem

#### Untuk Semua Komputer Client
- Sistem Operasi: Windows 10/11
- Node.js v14 atau lebih tinggi
- Git
- Memori RAM minimal 4GB
- Koneksi jaringan LAN

#### Khusus Server & Admin
- PostgreSQL 12 atau lebih tinggi
- Penyimpanan minimal 100GB
- Prosesor i5 generasi ke-8 atau setara

#### Khusus Gate-In
- Kamera webcam atau IP camera
- Penghubung relay untuk pengendali palang
- Koneksi untuk lampu indikator

#### Khusus Gate-Out
- Pemindai barcode/QR code
- Kamera verifikasi
- Printer termal untuk struk
- Penghubung relay untuk pengendali palang

### Persiapan Komputer Client Baru

Jika komputer client belum memiliki bahan-bahan yang diperlukan, ikuti langkah-langkah berikut:

1. **Instalasi Sistem Operasi**
   - Pastikan Windows 10/11 terinstal dan terupdate
   - Aktifkan Windows dengan lisensi yang sah

2. **Instalasi Software Dasar**
   - Unduh dan instal Node.js dari https://nodejs.org/ (pilih versi LTS)
   - Unduh dan instal Git dari https://git-scm.com/
   - Untuk server, unduh dan instal PostgreSQL dari https://www.postgresql.org/

3. **Konfigurasi Jaringan**
   
   #### Alokasi IP Statis
   | Perangkat          | IP Address      | Subnet Mask     | Gateway        | Fungsi                    |
   |-------------------|-----------------|-----------------|----------------|---------------------------|
   | Server & Admin    | 192.168.1.10   | 255.255.255.0  | 192.168.1.1   | Database & Admin Panel    |
   | Gate-In PC       | 192.168.1.20   | 255.255.255.0  | 192.168.1.1   | Aplikasi Gate Masuk      |
   | Gate-Out PC      | 192.168.1.30   | 255.255.255.0  | 192.168.1.1   | Aplikasi Gate Keluar     |
   | Kamera Gate-In   | 192.168.1.21   | 255.255.255.0  | 192.168.1.1   | IP Camera Gate Masuk     |
   | Kamera Gate-Out  | 192.168.1.31   | 255.255.255.0  | 192.168.1.1   | IP Camera Gate Keluar    |

   #### Konfigurasi Windows
   1. Buka Network & Internet Settings
   2. Pilih Change adapter options
   3. Klik kanan pada adapter jaringan > Properties
   4. Pilih Internet Protocol Version 4 (TCP/IPv4)
   5. Masukkan IP sesuai tabel di atas
   
   #### Konfigurasi IP Camera
   1. Akses web interface kamera menggunakan IP default
   2. Login dengan kredensial default (lihat manual kamera)
   3. Masuk ke Network Settings
   4. Set IP statis sesuai tabel di atas
   5. Simpan dan restart kamera

   #### Pengujian Koneksi
   1. Test koneksi antar komputer:
      ```
      ping 192.168.1.10 (test ke server)
      ping 192.168.1.20 (test ke gate-in)
      ping 192.168.1.30 (test ke gate-out)
      ```
   2. Test koneksi ke kamera:
      ```
      ping 192.168.1.21 (test ke kamera in)
      ping 192.168.1.31 (test ke kamera out)
      ```
   3. Pastikan semua perangkat bisa saling terhubung

   #### Port yang Diperlukan
   - 5000: API Server
   - 8080: WebSocket Server
   - 3000-3002: UI Aplikasi
   - 80/443: Akses web interface kamera
   - 554: RTSP stream kamera (jika digunakan)

4. **Persiapan Hardware**
   - Pasang dan konfigurasikan kamera di Gate-In
   - Pasang dan konfigurasikan pemindai barcode di Gate-Out
   - Pasang dan konfigurasikan printer termal di Gate-Out
   - Siapkan koneksi ke pengendali palang di Gate-In dan Gate-Out

### Instalasi Aplikasi

#### Menggunakan Installer

1. **Unduh Installer**
   - Unduh paket installer yang sesuai:
     - `parking-system-admin.zip` untuk Server & Admin
     - `parking-system-gate-in.zip` untuk Gate-In
     - `parking-system-gate-out.zip` untuk Gate-Out

2. **Jalankan Installer**
   - Ekstrak file zip
   - Jalankan file `install.bat` sebagai Administrator
   - Ikuti petunjuk yang muncul di layar
   - Masukkan informasi konfigurasi yang diminta (IP server, kredensial database, dll.)

3. **Verifikasi Instalasi**
   - Pastikan semua dependensi terinstal dengan benar
   - Periksa file konfigurasi (.env) di setiap komponen
   - Jalankan aplikasi menggunakan script startup yang dibuat oleh installer

#### Instalasi Manual

Jika installer tidak tersedia, ikuti langkah-langkah berikut:

1. **Clone Repository**
   ```
   git clone https://github.com/idiarso/ParkingTsReact.git
   cd ParkingTsReact
   ```

2. **Instalasi Server & Admin**
   ```
   cd server
   npm install
   # Buat file .env dengan konfigurasi yang sesuai
   cd ../admin
   npm install
   # Buat file .env dengan konfigurasi yang sesuai
   ```

3. **Instalasi Gate-In**
   ```
   cd gate-in
   npm install
   # Buat file .env dengan konfigurasi yang sesuai
   ```

4. **Instalasi Gate-Out**
   ```
   cd gate-out
   npm install
   # Buat file .env dengan konfigurasi yang sesuai
   ```

### Troubleshooting Instalasi

#### Masalah Node.js
- **Gejala**: Error "node not recognized as an internal or external command"
- **Solusi**: Pastikan Node.js terinstal dengan benar dan variabel PATH diatur dengan benar

#### Masalah Git
- **Gejala**: Error "git not recognized as an internal or external command"
- **Solusi**: Pastikan Git terinstal dengan benar dan variabel PATH diatur dengan benar

#### Masalah PostgreSQL
- **Gejala**: Error koneksi database
- **Solusi**: 
  - Verifikasi PostgreSQL berjalan (cek di Services)
  - Pastikan kredensial database benar di file .env
  - Pastikan database sudah dibuat

#### Masalah Dependensi
- **Gejala**: Error saat npm install
- **Solusi**:
  - Hapus folder node_modules dan coba lagi
  - Pastikan koneksi internet stabil
  - Coba dengan `npm install --legacy-peer-deps`

## Keamanan Sistem

### Keamanan Jaringan

1. **Isolasi Jaringan**
   - Gunakan VLAN terpisah untuk sistem parkir
   - Pisahkan jaringan untuk server, gate-in, dan gate-out
   - Implementasi firewall untuk membatasi akses:
     ```
     - Port 5000: API Server (hanya internal)
     - Port 8080: WebSocket Server (hanya internal)
     - Port 3000-3002: UI Aplikasi (sesuai kebutuhan)
     ```

2. **Enkripsi Data**
   - Semua komunikasi antar komponen menggunakan HTTPS
   - Data sensitif di database terenkripsi
   - Implementasi token-based authentication untuk API
   - Rotasi regular untuk credential dan token

3. **Monitoring & Backup**
   - Sistem logging terpusat di server
   - Backup otomatis database setiap hari
   - Monitor traffic jaringan untuk deteksi anomali
   - Alert system untuk kejadian mencurigakan

4. **Best Practices**
   - Update regular untuk semua komponen sistem
   - Ganti password secara berkala
   - Batasi akses fisik ke server dan perangkat
   - Dokumentasi lengkap untuk prosedur keamanan

### Prosedur Backup

1. **Database Backup**
   ```bash
   # Backup otomatis setiap hari jam 00:00
   0 0 * * * /usr/bin/pg_dump -U postgres parking > /backup/parking_$(date +\%Y\%m\%d).sql

   # Simpan backup 30 hari terakhir
   find /backup/ -name "parking_*.sql" -mtime +30 -delete
   ```

2. **File Backup**
   - Backup gambar kendaraan setiap minggu
   - Backup log sistem setiap hari
   - Simpan di lokasi terpisah dari server utama

3. **Restore Procedure**
   - Dokumentasi lengkap untuk restore database
   - Regular testing untuk prosedur restore
   - Verifikasi integritas backup

### Monitoring System

1. **Log Monitoring**
   - Centralized logging dengan ELK Stack
   - Alert untuk error kritis
   - Regular log rotation

2. **Performance Monitoring**
   - Monitor resource usage (CPU, RAM, Disk)
   - Monitor response time API
   - Monitor koneksi database

3. **Security Monitoring**
   - Monitor login attempts
   - Monitor akses file sistem
   - Monitor traffic jaringan

### Disaster Recovery

1. **Failover System**
   - Backup server dalam kondisi standby
   - Prosedur failover otomatis
   - Regular testing failover

2. **Recovery Time Objective (RTO)**
   - Database: 1 jam
   - Aplikasi: 2 jam
   - Sistem keseluruhan: 4 jam

3. **Recovery Point Objective (RPO)**
   - Database: 5 menit
   - File sistem: 1 hari

## Authentication

### Gate-In Station Login

1. Launch the Gate-In application
2. Enter your operator credentials:
   - Username
   - Password
3. Select your assigned gate if multiple gates are configured
4. Click "Login" to access the system
5. System will verify your permissions and display the Gate-In dashboard

### Gate-Out Station Login

1. Launch the Gate-Out application
2. Enter your operator credentials:
   - Username
   - Password
3. Select your assigned exit gate if multiple gates are configured
4. Click "Login" to access the system
5. System will verify your permissions and display the Gate-Out dashboard

### Admin Dashboard Login

1. Launch the Admin application
2. Enter administrator credentials:
   - Username
   - Password
3. Click "Login" to access the dashboard
4. System will verify your admin permissions and display the full administrative interface

## Vehicle Entry Process (Gate-In)

1. Vehicle approaches entry gate
2. System automatically captures the license plate using camera
   - If automatic detection fails, operator can manually input the license plate
3. System generates a unique ticket ID
4. Select vehicle type if not automatically detected
5. Click "Process Entry" to record the vehicle entry
6. System will:
   - Store entry information in database
   - Print ticket (if printer is connected)
   - Open gate automatically
7. Hand ticket to driver if physical tickets are used
8. Gate closes automatically after vehicle passes

## Vehicle Exit Process (Gate-Out)

### Standard Exit Process

1. Click "Kendaraan Keluar" (Vehicle Exit) on the Gate-Out dashboard
2. Process the exit using one of these methods:
   - Scan the entry ticket barcode/QR code
   - Manually enter the license plate number
3. System retrieves vehicle information and calculates parking fee
4. Verify vehicle images:
   - Compare entry image with current exit image
   - Confirm it's the same vehicle
5. Process payment:
   - Select payment method (cash, card, etc.)
   - Enter received amount if cash payment
   - System calculates change if applicable
6. Print receipt:
   - Click "Cetak Struk" to print payment receipt
   - Receipt shows entry/exit times, duration, and fee
7. Gate opens automatically after successful payment
8. Gate closes automatically after vehicle passes

### Special Cases

#### Lost Ticket

1. Click "Tiket Hilang" (Lost Ticket) on the Gate-Out dashboard
2. Enter the vehicle's license plate number
3. System searches for matching entry record
4. Verify vehicle identity using stored entry image
5. Apply lost ticket penalty fee (if applicable)
6. Process payment (may include regular fee plus penalty)
7. Print receipt
8. Gate opens after successful payment

#### Overnight Parking

1. When processing exit, system identifies vehicle as "Kendaraan Menginap" (Overnight)
2. Filter the vehicle list using "Kendaraan Menginap" option if needed
3. System automatically applies special overnight rates
4. Process payment with adjusted fee
5. Print receipt with overnight fee details
6. Gate opens after successful payment

## Daily Reports

### Shift Reports

1. From the Admin dashboard, open "Laporan Shift" (Shift Report)
2. Select the date and shift period to review
3. System displays all transactions during selected period
4. Verify each transaction for accuracy
5. Review summary information:
   - Total vehicles processed
   - Revenue breakdown by payment method
   - Revenue breakdown by vehicle type
6. Print report by clicking "Cetak Laporan"
7. Reports can be exported to PDF or Excel formats

### Troubleshooting Common Issues

#### Connection Issues
- Check network connectivity if system shows "Not connected"
- Verify socket server is running
- Restart the application if connection issues persist

#### Camera Problems
- Ensure camera is properly connected and powered
- Check camera settings in system configuration
- Switch to manual entry mode if camera is unavailable

#### Payment Processing Issues
- Verify payment terminal connections
- Check system configuration for payment methods
- Contact administrator if payment processing fails

## System Maintenance

Regular system checks are recommended:
- Backup database daily
- Update software when new versions are available
- Test hardware components weekly
- Monitor disk space and system resources

### Konfigurasi Printer Karcis

#### Instalasi Printer Gate-In
1. **Instalasi Driver**
   - Pasang printer thermal di komputer Gate-In
   - Install driver printer sesuai merk dan model
   - Untuk printer EPSON TM-series:
     ```
     - Download EPSON TM Virtual Port Driver
     - Install EPSON Advanced Printer Driver (APD)
     - Jalankan EPSON TM Virtual Port Driver
     ```
   - Untuk printer POS-58/80 series:
     ```
     - Install driver Generic/Text Only
     - Set paper size sesuai ukuran karcis (biasanya 58mm atau 80mm)
     ```

2. **Konfigurasi Windows**
   - Buka Settings > Printers & Scanners
   - Pilih printer thermal yang sudah terpasang
   - Set sebagai Default Printer
   - Print test page untuk memastikan printer berfungsi

3. **Konfigurasi di Aplikasi**
   - Buka file `.env` di folder gate-in
   - Tambahkan konfigurasi printer:
     ```
     PRINTER_NAME=nama_printer_thermal
     TICKET_WIDTH=58  # atau 80 tergantung printer
     PRINT_COPIES=1
     ```
   - Restart aplikasi gate-in untuk menerapkan perubahan

4. **Format Karcis**
   - Header: Nama lokasi parkir
   - QR Code/Barcode: Ticket ID
   - Informasi kendaraan:
     - Nomor plat
     - Jenis kendaraan
     - Waktu masuk
   - Footer: Informasi tambahan/promosi

5. **Troubleshooting Printer**
   - **Printer tidak terdeteksi**:
     1. Cek koneksi USB/Serial
     2. Reinstall driver
     3. Restart spooler service:
        ```
        net stop spooler
        net start spooler
        ```
   
   - **Hasil cetak tidak sesuai**:
     1. Cek pengaturan ukuran kertas
     2. Pastikan format karcis sesuai ukuran printer
     3. Kalibrasi printer jika diperlukan

   - **Printer error saat mencetak**:
     1. Cek ketersediaan kertas
     2. Bersihkan print head
     3. Cek status error di printer utility

6. **Maintenance Printer**
   - Bersihkan print head secara berkala
   - Cek dan ganti kertas sebelum habis
   - Backup printer cadangan untuk antisipasi kerusakan 