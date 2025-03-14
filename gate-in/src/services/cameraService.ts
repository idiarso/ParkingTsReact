import React from 'react';
import Webcam from 'react-webcam';
import { EventEmitter } from 'events';
import { detectLicensePlate, OCRResult } from './ocr';

// Tipe kamera yang didukung
export enum CameraType {
  WEBCAM = 'webcam',
  HTTP_SNAPSHOT = 'http_snapshot',
  MJPEG_STREAM = 'mjpeg_stream',
  RTSP_STREAM = 'rtsp_stream'
}

// Konfigurasi kamera
export interface CameraConfig {
  type: CameraType;
  url?: string;
  username?: string;
  password?: string;
  refreshRate?: number; // untuk HTTP snapshot (ms)
}

class CameraService {
  private webcamRef: React.RefObject<Webcam> | null = null;
  private eventEmitter: EventEmitter;
  private isProcessing: boolean = false;
  private cameraConfig: CameraConfig = { type: CameraType.WEBCAM };
  private lastImageUrl: string | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    console.log('Initializing camera service');
    this.eventEmitter = new EventEmitter();
  }
  
  init(webcamRef: React.RefObject<Webcam> | null) {
    console.log('Initializing camera with webcam ref');
    this.webcamRef = webcamRef;
    return true;
  }
  
  setConfig(config: CameraConfig): void {
    console.log('Setting camera config:', config);
    
    // Hentikan interval refresh jika ada
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    this.cameraConfig = config;
    
    // Jika tipe kamera adalah HTTP snapshot dan refresh rate diatur
    if (config.type === CameraType.HTTP_SNAPSHOT && config.refreshRate && config.refreshRate > 0) {
      this.startSnapshotRefresh(config.refreshRate);
    }
  }
  
  private startSnapshotRefresh(refreshRate: number): void {
    console.log(`Starting snapshot refresh every ${refreshRate}ms`);
    
    this.refreshInterval = setInterval(() => {
      this.refreshSnapshot();
    }, refreshRate);
  }
  
  private async refreshSnapshot(): Promise<void> {
    if (this.isProcessing || this.cameraConfig.type !== CameraType.HTTP_SNAPSHOT || !this.cameraConfig.url) {
      return;
    }
    
    try {
      this.isProcessing = true;
      
      // Verifikasi URL valid
      let urlString = this.cameraConfig.url;
      if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        urlString = 'http://' + urlString;
      }
      
      try {
        // Coba parse URL untuk memastikan valid
        const url = new URL(urlString);
        
        // Tambahkan timestamp untuk mencegah cache
        url.searchParams.append('t', Date.now().toString());
        
        // Ambil konfigurasi fetch
        let fetchUrl = url.toString();
        let fetchOptions: RequestInit = {
          mode: 'cors', // Coba dengan CORS terlebih dahulu
          cache: 'no-cache',
          credentials: 'same-origin',
        };
        
        if (this.cameraConfig.username && this.cameraConfig.password) {
          const credentials = btoa(`${this.cameraConfig.username}:${this.cameraConfig.password}`);
          fetchOptions.headers = {
            'Authorization': `Basic ${credentials}`
          };
        }
        
        // Catatan penting: di aplikasi produksi sebenarnya,
        // kita butuh proxy server untuk mengatasi masalah CORS
        console.log('Mencoba mengambil gambar dari:', fetchUrl);
        
        try {
          // Coba ambil gambar
          const response = await fetch(fetchUrl, fetchOptions);
          
          if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
          }
          
          // Buat URL objek dari blob
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          
          // Simpan URL gambar terakhir
          if (this.lastImageUrl) {
            URL.revokeObjectURL(this.lastImageUrl);
          }
          this.lastImageUrl = imageUrl;
          
          // Emit event dengan URL gambar baru
          this.eventEmitter.emit('snapshot', imageUrl);
          console.log('Snapshot berhasil diperbarui');
        } catch (fetchError: any) {
          console.error('Error saat fetch kamera:', fetchError);
          
          // Jika error adalah CORS, tampilkan pesan yang lebih jelas
          if (fetchError.message && fetchError.message.includes('CORS')) {
            console.error('CORS error: Kamera tidak mengizinkan akses dari browser. Gunakan proxy server atau ekstensi CORS.');
            this.eventEmitter.emit('error', new Error('CORS error: Kamera tidak mengizinkan akses langsung dari browser'));
          } else {
            this.eventEmitter.emit('error', fetchError);
          }
          
          // Tambahkan petunjuk untuk pengguna
          console.info('Petunjuk: Anda mungkin perlu proxy server untuk mengakses kamera IP dari browser web. ' +
            'Atau gunakan ekstensi seperti "CORS Unblock" untuk testing.');
        }
      } catch (urlError) {
        console.error('URL tidak valid:', urlError);
        this.eventEmitter.emit('error', new Error(`URL kamera tidak valid: ${urlString}`));
      }
    } catch (error) {
      console.error('Error saat refresh snapshot:', error);
      this.eventEmitter.emit('error', error);
    } finally {
      this.isProcessing = false;
    }
  }
  
  async captureVehicleImage(licensePlate?: string): Promise<string | null> {
    console.log('Capturing vehicle image, license plate:', licensePlate);
    
    if (this.isProcessing) {
      console.warn('Already processing an image capture');
      return null;
    }
    
    this.isProcessing = true;
    
    try {
      let imageUrl: string | null = null;
      
      // Tangkap gambar berdasarkan tipe kamera
      switch (this.cameraConfig.type) {
        case CameraType.WEBCAM:
          imageUrl = await this.captureFromWebcam();
          break;
        case CameraType.HTTP_SNAPSHOT:
          imageUrl = await this.captureFromHttpSnapshot();
          break;
        case CameraType.MJPEG_STREAM:
        case CameraType.RTSP_STREAM:
          imageUrl = await this.captureFromStream();
          break;
        default:
          throw new Error(`Unsupported camera type: ${this.cameraConfig.type}`);
      }
      
      if (!imageUrl) {
        throw new Error('Failed to capture image');
      }
      
      // Tambahkan teks plat nomor jika ada
      if (licensePlate) {
        imageUrl = await this.addTextToImage(imageUrl, licensePlate);
      }
      
      console.log('Image captured successfully');
      return imageUrl;
    } catch (error) {
      console.error('Error capturing vehicle image:', error);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }
  
  private async captureFromWebcam(): Promise<string | null> {
    if (!this.webcamRef || !this.webcamRef.current) {
      console.error('Webcam reference not available');
      return null;
    }
    
    const imageSrc = this.webcamRef.current.getScreenshot();
    return imageSrc;
  }
  
  private async captureFromHttpSnapshot(): Promise<string | null> {
    if (!this.cameraConfig.url) {
      console.error('Camera URL not configured');
      return null;
    }
    
    try {
      this.isProcessing = true;
      
      // Verifikasi URL valid
      let urlString = this.cameraConfig.url;
      if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        urlString = 'http://' + urlString;
      }
      
      // Buat URL dengan timestamp untuk menghindari cache
      const url = new URL(urlString);
      url.searchParams.append('t', Date.now().toString());
      
      // Cek apakah ada metode yang berhasil sebelumnya
      const savedMethodStr = localStorage.getItem('camera_successful_method');
      if (savedMethodStr) {
        try {
          const savedMethod = JSON.parse(savedMethodStr);
          // Periksa apakah metode masih relevan (kurang dari 24 jam)
          const isStillRelevant = (Date.now() - savedMethod.timestamp) < 24 * 60 * 60 * 1000;
          
          if (isStillRelevant) {
            console.log(`Menggunakan metode tersimpan: ${savedMethod.methodName}`);
            
            // Persiapkan fetch options sesuai metode yang berhasil
            let fetchUrl = savedMethod.methodName === 'URL dengan kredensial' ? 
              this.getUrlWithCredentials(url.toString()) : 
              (savedMethod.methodName === 'URL alternatif' ? 
                this.getAlternativeUrl(url.toString()) : 
                url.toString());
            
            const fetchOptions: RequestInit = {
              mode: savedMethod.options.mode as RequestMode,
              cache: 'no-cache',
              credentials: savedMethod.options.credentials as RequestCredentials
            };
            
            // Tambahkan header jika diperlukan
            if (savedMethod.options.hasHeaders && this.cameraConfig.username && this.cameraConfig.password) {
              const username = encodeURIComponent(this.cameraConfig.username);
              const password = encodeURIComponent(this.cameraConfig.password);
              const credentials = btoa(`${username}:${password}`);
              
              fetchOptions.headers = {
                'Authorization': `Basic ${credentials}`,
                'Cache-Control': 'no-cache'
              };
            }
            
            console.log('Mencoba menggunakan metode tersimpan:', {
              url: fetchUrl.replace(/:([^:@]+)@/, ':***@'),
              options: {
                ...fetchOptions,
                headers: fetchOptions.headers ? 'Set' : 'Not set'
              }
            });
            
            const response = await fetch(fetchUrl, fetchOptions);
            
            // Jika no-cors, kita tidak dapat memeriksa response.ok
            if (savedMethod.options.mode === 'no-cors') {
              const blob = await response.blob();
              if (blob.size > 100) {
                const imageUrl = URL.createObjectURL(blob);
                console.log('Berhasil mengambil gambar dengan metode tersimpan!');
                return imageUrl;
              }
              throw new Error('Blob terlalu kecil dengan mode no-cors');
            } else {
              if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
              }
              
              const blob = await response.blob();
              const imageUrl = URL.createObjectURL(blob);
              console.log('Berhasil mengambil gambar dengan metode tersimpan!');
              return imageUrl;
            }
          } else {
            console.log('Metode tersimpan sudah kedaluwarsa, menggunakan pendekatan baru');
          }
        } catch (savedMethodError) {
          console.warn('Gagal menggunakan metode tersimpan:', savedMethodError);
          // Lanjutkan dengan pendekatan normal
        }
      }
      
      // Jika tidak ada metode tersimpan atau metode tersimpan gagal, gunakan pendekatan bertahap
      
      // Tambahkan kredensial jika ada
      let fetchUrl = url.toString();
      let fetchOptions: RequestInit = {
        mode: 'cors', // Try CORS first
        cache: 'no-cache',
        credentials: 'include' // Ubah menjadi 'include' untuk mendukung cookies
      };
      
      // Metode 1: Gunakan Basic Auth header jika ada username dan password
      if (this.cameraConfig.username && this.cameraConfig.password) {
        console.log('Menggunakan Basic Auth header');
        
        try {
          // Coba gunakan encodeURIComponent untuk menangani karakter khusus
          const username = encodeURIComponent(this.cameraConfig.username);
          const password = encodeURIComponent(this.cameraConfig.password);
          const credentials = btoa(`${username}:${password}`);
          
          fetchOptions.headers = {
            'Authorization': `Basic ${credentials}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          };
        } catch (encodeError) {
          console.error('Error encoding credentials:', encodeError);
        }
      }
      
      console.log('Capturing from camera URL:', fetchUrl);
      console.log('Fetch options:', JSON.stringify({
        ...fetchOptions,
        headers: fetchOptions.headers ? 'Set (contents hidden for security)' : 'Not set'
      }));
      
      // Coba Metode 1: Fetch dengan Basic Auth header
      try {
        console.log('Metode 1: Fetch dengan Basic Auth header');
        const response = await fetch(fetchUrl, fetchOptions);
        
        // Cek apakah respons adalah 401 Unauthorized dengan Digest auth
        if (response.status === 401) {
          const authHeader = response.headers.get('WWW-Authenticate');
          if (authHeader && authHeader.startsWith('Digest')) {
            console.log('Kamera meminta autentikasi Digest. Basic Auth tidak akan berfungsi.');
            console.log('Header WWW-Authenticate:', authHeader);
            
            // Notifikasi ke pengguna bahwa kamera menggunakan Digest auth
            this.eventEmitter.emit('error', new Error('Kamera menggunakan autentikasi Digest. Gunakan URL dengan kredensial dalam format URL atau ekstensi CORS Unblock.'));
            
            // Kita tetap mencoba metode lain, tapi beri tahu pengguna
            console.log('Mencoba metode alternatif untuk Digest auth...');
          }
        }
        
        if (!response.ok) {
          console.warn(`HTTP error: ${response.status} - ${response.statusText}`);
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        // Buat URL objek dari blob
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        console.log('Berhasil mengambil gambar dengan metode 1!');
        return imageUrl;
      } catch (method1Error) {
        console.warn('Metode 1 gagal:', method1Error);
        
        // Metode 2: Coba gunakan kredensial dalam URL jika metode 1 gagal
        if (this.cameraConfig.username && this.cameraConfig.password) {
          try {
            console.log('Metode 2: Mencoba kredensial dalam URL');
            
            // Buat URL baru dengan kredensial di dalamnya
            const urlWithAuth = new URL(urlString);
            urlWithAuth.username = encodeURIComponent(this.cameraConfig.username);
            urlWithAuth.password = encodeURIComponent(this.cameraConfig.password);
            urlWithAuth.searchParams.append('t', Date.now().toString());
            
            const authUrl = urlWithAuth.toString();
            console.log('URL dengan auth:', authUrl.replace(/:([^:@]+)@/, ':***@')); // Log URL tapi sembunyikan password
            
            // Fetch tanpa header auth khusus
            const authResponse = await fetch(authUrl, {
              mode: 'cors',
              cache: 'no-cache',
              credentials: 'include'
            });
            
            if (!authResponse.ok) {
              console.warn(`HTTP error dengan metode 2: ${authResponse.status} - ${authResponse.statusText}`);
              throw new Error(`HTTP error: ${authResponse.status}`);
            }
            
            // Buat URL objek dari blob
            const authBlob = await authResponse.blob();
            const authImageUrl = URL.createObjectURL(authBlob);
            console.log('Berhasil mengambil gambar dengan metode 2!');
            return authImageUrl;
          } catch (method2Error) {
            console.warn('Metode 2 gagal:', method2Error);
            
            // Metode 3: Coba dengan no-cors sebagai upaya terakhir
            try {
              console.log('Metode 3: Mencoba dengan mode no-cors');
              const noCorsResponse = await fetch(fetchUrl, {
                mode: 'no-cors', // Terakhir coba dengan no-cors
                cache: 'no-cache'
              });
              
              // Note: dengan mode no-cors, kita tidak bisa mengecek response.ok
              // dan hanya bisa mendapatkan opaque response
              
              const noCorsBlob = await noCorsResponse.blob();
              if (noCorsBlob.size > 100) { // Asumsi bahwa blob dengan ukuran > 100 bytes adalah valid
                const noCorsImageUrl = URL.createObjectURL(noCorsBlob);
                console.log('Berhasil mengambil gambar dengan metode 3!');
                return noCorsImageUrl;
              } else {
                console.warn('Blob terlalu kecil, mungkin bukan gambar valid');
                throw new Error('Blob terlalu kecil');
              }
            } catch (method3Error) {
              console.error('Semua metode gagal:', method3Error);
              throw method3Error;
            }
          }
        } else {
          throw method1Error;
        }
      }
    } catch (error) {
      console.error('Error capturing from HTTP snapshot:', error);
      this.eventEmitter.emit('error', new Error('Gagal mengambil snapshot dari kamera. Periksa URL dan kredensial.'));
      return null;
    } finally {
      this.isProcessing = false;
    }
  }
  
  private async captureFromStream(): Promise<string | null> {
    if (!this.cameraConfig.url) {
      console.error('URL kamera tidak dikonfigurasi');
      return null;
    }

    try {
      const url = new URL(this.cameraConfig.url.startsWith('http') ? 
        this.cameraConfig.url : 
        'http://' + this.cameraConfig.url);

      // Ambil endpoint yang berhasil dari localStorage
      const savedMethodStr = localStorage.getItem('successful_mjpeg_method');
      let endpoint = '';
      
      if (savedMethodStr) {
        try {
          const savedMethod = JSON.parse(savedMethodStr);
          // Periksa apakah metode masih relevan (kurang dari 1 jam)
          if (Date.now() - savedMethod.timestamp < 60 * 60 * 1000) {
            endpoint = savedMethod.endpoint;
          }
        } catch (e) {
          console.warn('Error parsing saved method:', e);
        }
      }

      // Jika tidak ada endpoint tersimpan, gunakan default
      if (!endpoint) {
        endpoint = '/cgi-bin/mjpg/video.cgi';
      }

      const fullUrl = `${url.origin}${endpoint}`;
      console.log('Menggunakan URL MJPEG:', fullUrl);

      // Buat Basic Auth header
      const username = this.cameraConfig.username || 'admin';
      const password = this.cameraConfig.password || '@dminparkir';
      const credentials = btoa(`${username}:${password}`);

      // Buat img element untuk memuat gambar
      return new Promise((resolve) => {
        const img = document.createElement('img');
        img.style.display = 'none';
        document.body.appendChild(img);

        // Set timeout untuk membatalkan jika terlalu lama
        const timeoutId = setTimeout(() => {
          document.body.removeChild(img);
          console.warn('Timeout mengambil gambar');
          resolve(null);
        }, 10000);

        // Handler ketika gambar berhasil dimuat
        img.onload = () => {
          try {
            // Buat canvas untuk mengambil gambar
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) {
              // Gambar ke canvas
              ctx.drawImage(img, 0, 0);
              
              // Konversi ke data URL
              const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
              
              // Bersihkan
              clearTimeout(timeoutId);
              document.body.removeChild(img);
              
              console.log('Berhasil mengambil gambar dari kamera');
              resolve(imageUrl);
            } else {
              console.error('Gagal mendapatkan context canvas');
              resolve(null);
            }
          } catch (error) {
            console.error('Error saat memproses gambar:', error);
            resolve(null);
          }
        };

        // Handler untuk error
        img.onerror = () => {
          clearTimeout(timeoutId);
          document.body.removeChild(img);
          console.error('Gagal memuat gambar dari kamera');
          
          // Jika gagal, coba gunakan endpoint snapshot sebagai fallback
          this.captureFromHttpSnapshot().then(resolve);
        };

        // Tambahkan timestamp untuk menghindari cache
        const timestamp = Date.now();
        
        // Set header Authorization menggunakan atribut crossOrigin
        img.crossOrigin = 'use-credentials';
        img.src = `${fullUrl}?t=${timestamp}`;
      });
    } catch (error) {
      console.error('Error dalam captureFromStream:', error);
      return this.captureFromHttpSnapshot(); // Fallback ke HTTP snapshot
    }
  }
  
  private async addTextToImage(imageUrl: string, text: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Gambar gambar asli ke canvas
        ctx.drawImage(img, 0, 0);
        
        // Atur font dan warna untuk teks
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'yellow';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        
        // Tambahkan teks di bagian bawah gambar
        const textX = 20;
        const textY = img.height - 30;
        
        // Tambahkan stroke (outline) untuk keterbacaan
        ctx.strokeText(text, textX, textY);
        ctx.fillText(text, textX, textY);
        
        // Konversi canvas ke URL data
        const newImageUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // Hapus URL gambar asli
        URL.revokeObjectURL(imageUrl);
        
        resolve(newImageUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageUrl;
    });
  }
  
  async detectPlate(imageUrl: string): Promise<OCRResult | null> {
    try {
      return await detectLicensePlate(imageUrl);
    } catch (error) {
      console.error('Error detecting license plate:', error);
      return null;
    }
  }
  
  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }
  
  off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
  
  // Uji koneksi ke kamera
  async testConnection(): Promise<boolean> {
    console.log('=== Tes Koneksi Kamera ===');
    console.log('Konfigurasi kamera:', {
      type: this.cameraConfig.type,
      url: this.cameraConfig.url,
      username: this.cameraConfig.username ? '****' : undefined,
      hasPassword: !!this.cameraConfig.password,
      refreshRate: this.cameraConfig.refreshRate
    });
    
    if (!this.cameraConfig.url && this.cameraConfig.type !== CameraType.WEBCAM) {
      console.error('URL kamera belum dikonfigurasi');
      return false;
    }
    
    switch (this.cameraConfig.type) {
      case CameraType.WEBCAM:
        return this.testWebcam();
      case CameraType.HTTP_SNAPSHOT:
        return this.testHttpSnapshot();
      case CameraType.MJPEG_STREAM:
        return this.testMjpegStream();
      case CameraType.RTSP_STREAM:
        return this.testRtspStream();
      default:
        console.error('Tipe kamera tidak didukung:', this.cameraConfig.type);
        return false;
    }
  }
  
  private async testWebcam(): Promise<boolean> {
    if (!this.webcamRef || !this.webcamRef.current) {
      console.error('Webcam reference tidak tersedia');
      return false;
    }
    
    try {
      // Ambil screenshot untuk memastikan webcam berfungsi
      const screenshot = this.webcamRef.current.getScreenshot();
      return !!screenshot;
    } catch (error) {
      console.error('Error saat tes webcam:', error);
      return false;
    }
  }
  
  private async testHttpSnapshot(): Promise<boolean> {
    if (!this.cameraConfig.url) {
      console.error('URL kamera tidak dikonfigurasi');
      return false;
    }
    
    console.log('Mencoba beberapa metode untuk menguji koneksi ke kamera IP...');
    
    // Metode-metode yang akan dicoba
    const methods = [
      { name: 'Standard', urlModifier: (url: string) => url, withCreds: true },
      { name: 'URL dengan kredensial', urlModifier: this.getUrlWithCredentials.bind(this), withCreds: false },
      { name: 'URL alternatif', urlModifier: this.getAlternativeUrl.bind(this), withCreds: true },
      { name: 'No-CORS', urlModifier: (url: string) => url, withCreds: true, noCors: true },
      // Metode tambahan untuk Dahua dengan parameter khusus
      { name: 'Dahua Channel 1', urlModifier: (url: string) => this.addDahuaParams(url, { channel: 1 }), withCreds: true },
      { name: 'Dahua SubType 1', urlModifier: (url: string) => this.addDahuaParams(url, { subtype: 1 }), withCreds: true },
      { name: 'Dahua Kombinasi', urlModifier: (url: string) => this.addDahuaParams(url, { channel: 1, subtype: 0 }), withCreds: true }
    ];
    
    // Normalize URL
    let urlString = this.cameraConfig.url;
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      urlString = 'http://' + urlString;
    }
    
    // Buat URL dengan timestamp
    const url = new URL(urlString);
    url.searchParams.append('t', Date.now().toString());
    urlString = url.toString();
    
    // Coba setiap metode
    for (const method of methods) {
      try {
        console.log(`==== Mencoba Metode: ${method.name} ====`);
        const modifiedUrl = method.urlModifier(urlString);
        console.log('URL:', modifiedUrl.replace(/:([^:@]+)@/, ':***@')); // Sembunyikan password dalam log
        
        const fetchOptions: RequestInit = {
          mode: method.noCors ? 'no-cors' : 'cors',
          cache: 'no-cache',
          credentials: 'include'
        };
        
        // Tambahkan credential header jika diperlukan
        if (method.withCreds && this.cameraConfig.username && this.cameraConfig.password) {
          try {
            const username = encodeURIComponent(this.cameraConfig.username);
            const password = encodeURIComponent(this.cameraConfig.password);
            const credentials = btoa(`${username}:${password}`);
            
            fetchOptions.headers = {
              'Authorization': `Basic ${credentials}`,
              'Cache-Control': 'no-cache'
            };
            console.log('Menambahkan header Authorization');
          } catch (e) {
            console.warn('Gagal mengkode kredensial:', e);
          }
        }
        
        console.log('Fetch options:', JSON.stringify({
          mode: fetchOptions.mode,
          cache: fetchOptions.cache,
          credentials: fetchOptions.credentials,
          headers: fetchOptions.headers ? 'Set' : 'Not set'
        }));
        
        const response = await fetch(modifiedUrl, fetchOptions);
        
        // Jika no-cors, kita tidak bisa mengecek response.ok
        if (method.noCors) {
          console.log('Menggunakan mode no-cors, tidak dapat membaca status response');
          const blob = await response.blob();
          if (blob.size > 100) { // Asumsi bahwa blob dengan ukuran > 100 bytes adalah valid
            console.log(`Metode ${method.name} BERHASIL!`);
            this.saveSuccessfulMethod(method.name, modifiedUrl, fetchOptions);
            return true;
          } else {
            console.warn('Blob terlalu kecil, mungkin bukan gambar valid');
            continue; // Coba metode berikutnya
          }
        } else {
          console.log('Status response:', response.status, response.statusText);
          
          if (!response.ok) {
            console.warn(`HTTP error: ${response.status}`);
            continue; // Coba metode berikutnya
          }
          
          const contentType = response.headers.get('content-type');
          console.log('Content-Type:', contentType);
          
          // Verifikasi bahwa response adalah gambar
          if (contentType && contentType.startsWith('image/')) {
            console.log(`Metode ${method.name} BERHASIL!`);
            this.saveSuccessfulMethod(method.name, modifiedUrl, fetchOptions);
            return true;
          } else {
            console.warn('Response bukan gambar:', contentType);
            
            // Coba lihat isi response jika bukan gambar
            try {
              const text = await response.text();
              console.log('Response text (50 karakter pertama):', text.substring(0, 50));
            } catch (e) {
              console.error('Gagal membaca isi response:', e);
            }
            
            continue; // Coba metode berikutnya
          }
        }
      } catch (error) {
        console.warn(`Metode ${method.name} gagal:`, error);
        // Lanjutkan ke metode berikutnya
      }
    }
    
    console.error('Semua metode gagal');
    return false;
  }
  
  private async testMjpegStream(): Promise<boolean> {
    if (!this.cameraConfig.url) {
      console.error('URL kamera tidak dikonfigurasi');
      return false;
    }

    console.log('Menguji koneksi MJPEG stream...');

    try {
      // Normalize URL
      let baseUrl = this.cameraConfig.url;
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = 'http://' + baseUrl;
      }
      baseUrl = baseUrl.replace(/\/$/, '');

      // Daftar endpoint MJPEG yang umum untuk Dahua
      const endpoints = [
        '/cgi-bin/mjpg/video.cgi',
        '/mjpg/video.cgi',
        '/video.cgi',
        '/video.mjpg',
        '/videostream.cgi',
        '/Streaming/Channels/1',
        '/Streaming/Channels/101'
      ];

      const url = new URL(baseUrl);
      const username = this.cameraConfig.username || 'admin';
      const password = this.cameraConfig.password || '@dminparkir';

      // Buat Basic Auth header
      const credentials = btoa(`${username}:${password}`);
      const headers = {
        'Authorization': `Basic ${credentials}`,
        'Cache-Control': 'no-cache'
      };

      // Coba setiap endpoint
      for (const endpoint of endpoints) {
        try {
          const fullUrl = `${url.origin}${endpoint}`;
          console.log('Mencoba endpoint MJPEG:', fullUrl);

          const response = await fetch(fullUrl, {
            mode: 'no-cors',
            cache: 'no-cache',
            credentials: 'include',
            headers: headers
          });

          // Untuk mode no-cors, kita tidak bisa mengecek content-type
          // Tapi kita bisa mengecek apakah ada response
          const blob = await response.blob();
          if (blob.size > 100) { // Asumsi response valid jika > 100 bytes
            console.log(`Endpoint MJPEG berhasil: ${endpoint}`);
            
            // Simpan endpoint yang berhasil
            localStorage.setItem('successful_mjpeg_endpoint', endpoint);
            localStorage.setItem('successful_mjpeg_method', JSON.stringify({
              endpoint,
              timestamp: Date.now()
            }));
            
            return true;
          }
        } catch (error) {
          console.warn(`Gagal mengakses endpoint ${endpoint}:`, error);
          continue;
        }
      }

      // Jika semua endpoint gagal, coba akses homepage
      try {
        console.log('Mencoba akses homepage');
        const response = await fetch(url.origin, {
          mode: 'no-cors',
          cache: 'no-cache',
          credentials: 'include',
          headers: headers
        });

        const blob = await response.blob();
        if (blob.size > 100) {
          console.log('Berhasil mengakses homepage kamera');
          return true;
        }
      } catch (error) {
        console.error('Gagal mengakses homepage:', error);
      }

      console.error('Semua endpoint MJPEG gagal');
      return false;
    } catch (error) {
      console.error('Error dalam testMjpegStream:', error);
      return false;
    }
  }
  
  private async testRtspStream(): Promise<boolean> {
    console.log('Tes RTSP stream melalui browser tidak didukung. Gunakan aplikasi desktop seperti VLC.');
    return false;
  }
  
  // Helper untuk URL dengan kredensial
  private getUrlWithCredentials(urlString: string): string {
    if (!this.cameraConfig.username || !this.cameraConfig.password) {
      return urlString;
    }
    
    try {
      const url = new URL(urlString);
      url.username = encodeURIComponent(this.cameraConfig.username);
      url.password = encodeURIComponent(this.cameraConfig.password);
      return url.toString();
    } catch (e) {
      console.error('Error saat menambahkan kredensial ke URL:', e);
      return urlString;
    }
  }
  
  // Helper untuk URL alternatif berdasarkan format Dahua dan lainnya
  private getAlternativeUrl(urlString: string): string {
    try {
      const url = new URL(urlString);
      const path = url.pathname;
      const hostname = url.hostname;
      
      // Dahua memiliki beberapa endpoint yang berbeda tergantung model dan firmware
      const dahuaEndpoints = [
        '/cgi-bin/snapshot.cgi',
        '/cgi-bin/video.cgi',
        '/cgi-bin/mjpg/video.cgi',
        '/cgi-bin/jpg/image.cgi',
        '/snap.jpg',
        '/onvif-http/snapshot',
        '/onvifsnapshot/media_service/snapshot',
        '/image/jpeg.cgi'
      ];
      
      // Jika URL adalah root atau salah satu endpoint sudah ada
      if (path === '/' || path === '') {
        console.log('URL adalah root, mencoba endpoint Dahua default');
        // Mulai dengan snapshot.cgi
        return `http://${hostname}/cgi-bin/snapshot.cgi`;
      }
      
      // Jika endpoint sudah termasuk dalam salah satu endpoint yang umum
      for (let i = 0; i < dahuaEndpoints.length; i++) {
        if (path.endsWith(dahuaEndpoints[i])) {
          // Coba endpoint berikutnya dalam daftar
          const nextEndpoint = dahuaEndpoints[(i + 1) % dahuaEndpoints.length];
          console.log(`Mencoba endpoint alternatif: ${nextEndpoint}`);
          // Buat URL baru dengan mengganti path
          return `http://${hostname}${nextEndpoint}`;
        }
      }
      
      // Jika tidak cocok dengan endpoint manapun, gunakan default
      return `http://${hostname}/cgi-bin/snapshot.cgi`;
    } catch (e) {
      console.error('Error saat membuat URL alternatif:', e);
      return urlString;
    }
  }
  
  // Simpan metode yang berhasil untuk digunakan nanti
  private saveSuccessfulMethod(methodName: string, url: string, options: RequestInit): void {
    localStorage.setItem('camera_successful_method', JSON.stringify({
      methodName,
      url,
      options: {
        mode: options.mode,
        cache: options.cache,
        credentials: options.credentials,
        hasHeaders: !!options.headers
      },
      timestamp: Date.now()
    }));
    console.log(`Metode ${methodName} berhasil disimpan untuk penggunaan selanjutnya`);
  }
  
  // Helper untuk menambahkan parameter khusus Dahua ke URL
  private addDahuaParams(urlString: string, params: { [key: string]: any }): string {
    try {
      const url = new URL(urlString);
      
      // Tambahkan semua parameter yang diberikan
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key].toString());
      });
      
      return url.toString();
    } catch (e) {
      console.error('Error saat menambahkan parameter Dahua:', e);
      return urlString;
    }
  }

  // Helper untuk mendapatkan URL MJPEG yang berhasil
  private getMjpegUrl(): string {
    if (!this.cameraConfig.url) {
      return '';
    }

    try {
      const baseUrl = this.cameraConfig.url.startsWith('http') ? 
        this.cameraConfig.url : 
        'http://' + this.cameraConfig.url;
      
      const savedEndpoint = localStorage.getItem('successful_mjpeg_endpoint');
      if (savedEndpoint) {
        const username = encodeURIComponent(this.cameraConfig.username || 'admin');
        const password = encodeURIComponent(this.cameraConfig.password || 'admin123');
        const host = new URL(baseUrl).host;
        
        return `http://${username}:${password}@${host}${savedEndpoint}`;
      }
      
      // Default ke URL dasar jika tidak ada endpoint tersimpan
      return baseUrl;
    } catch (error) {
      console.error('Error membuat URL MJPEG:', error);
      return this.cameraConfig.url;
    }
  }
}

// Singleton instance
const cameraService = new CameraService();
export default cameraService; 