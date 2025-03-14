import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  SelectChangeEvent
} from '@mui/material';
import cameraService, { CameraType, CameraConfig } from '../services/cameraService';

const CameraSettings: React.FC = () => {
  const [cameraConfig, setCameraConfig] = useState<CameraConfig>({
    type: CameraType.WEBCAM,
    url: '',
    username: '',
    password: '',
    refreshRate: 1000
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Simpan konfigurasi ke localStorage saat berubah
  useEffect(() => {
    const savedConfig = localStorage.getItem('cameraConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setCameraConfig(parsedConfig);
        
        // Terapkan konfigurasi yang tersimpan
        cameraService.setConfig(parsedConfig);
      } catch (err) {
        console.error('Error parsing saved camera config:', err);
      }
    }
  }, []);
  
  // Handler untuk perubahan input text field
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    
    if (name) {
      setCameraConfig(prev => {
        // Konversi refreshRate ke number jika diperlukan
        const newValue = name === 'refreshRate' ? Number(value) : value;
        return { ...prev, [name]: newValue };
      });
    }
  };
  
  // Handler khusus untuk Select (MUI)
  const handleSelectChange = (e: SelectChangeEvent<CameraType>) => {
    const { name, value } = e.target;
    
    if (name) {
      setCameraConfig(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Simpan dan terapkan konfigurasi
  const handleSave = () => {
    try {
      // Simpan ke localStorage
      localStorage.setItem('cameraConfig', JSON.stringify(cameraConfig));
      
      // Terapkan konfigurasi
      cameraService.setConfig(cameraConfig);
      
      setError(null);
    } catch (err) {
      console.error('Error saving camera config:', err);
      setError('Gagal menyimpan konfigurasi kamera');
    }
  };
  
  // Tes koneksi kamera
  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    setError(null);
    
    try {
      // Terapkan konfigurasi terlebih dahulu
      cameraService.setConfig(cameraConfig);
      
      // Tunggu sebentar untuk memastikan konfigurasi diterapkan
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Tes koneksi
      const result = await cameraService.testConnection();
      setTestResult(result);
      
      if (!result) {
        setError('Gagal terhubung ke kamera. Periksa URL dan kredensial.');
      }
    } catch (err) {
      console.error('Error testing camera connection:', err);
      setError('Error saat menguji koneksi kamera');
      setTestResult(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Pengaturan Kamera
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="camera-type-label">Tipe Kamera</InputLabel>
            <Select
              labelId="camera-type-label"
              name="type"
              value={cameraConfig.type}
              label="Tipe Kamera"
              onChange={handleSelectChange}
            >
              <MenuItem value={CameraType.WEBCAM}>Webcam Lokal</MenuItem>
              <MenuItem value={CameraType.HTTP_SNAPSHOT}>HTTP (JPEG/PNG)</MenuItem>
              <MenuItem value={CameraType.MJPEG_STREAM}>MJPEG Stream</MenuItem>
              <MenuItem value={CameraType.RTSP_STREAM}>RTSP Stream</MenuItem>
            </Select>
            <FormHelperText>
              Pilih tipe kamera yang akan digunakan
            </FormHelperText>
          </FormControl>
        </Grid>
        
        {cameraConfig.type !== CameraType.WEBCAM && (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL Kamera"
                name="url"
                value={cameraConfig.url || ''}
                onChange={handleChange}
                margin="normal"
                helperText={
                  cameraConfig.type === CameraType.HTTP_SNAPSHOT 
                    ? "Untuk kamera Dahua yang hanya bisa diakses di halaman utama, masukkan URL utama: http://192.168.1.108" 
                    : cameraConfig.type === CameraType.MJPEG_STREAM
                    ? "Untuk kamera Dahua yang hanya bisa diakses di halaman utama, masukkan URL utama: http://192.168.1.108"
                    : "Contoh: rtsp://192.168.1.108:554/cam/realmonitor"
                }
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={cameraConfig.username || ''}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={cameraConfig.password || ''}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            
            {cameraConfig.type === CameraType.HTTP_SNAPSHOT && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Refresh Rate (ms)"
                  name="refreshRate"
                  type="number"
                  value={cameraConfig.refreshRate || 1000}
                  onChange={handleChange}
                  margin="normal"
                  helperText="Interval refresh dalam milidetik (1000 = 1 detik)"
                />
              </Grid>
            )}
          </>
        )}
        
        <Grid item xs={12}>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSave}
              disabled={isLoading}
            >
              Simpan Konfigurasi
            </Button>
            
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={handleTestConnection}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? 'Menguji...' : 'Tes Koneksi'}
            </Button>
            
            {cameraConfig.type !== CameraType.WEBCAM && cameraConfig.url && (
              <Button
                variant="outlined"
                color="info"
                onClick={() => {
                  // Format URL dengan benar
                  let url = cameraConfig.url || '';
                  if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'http://' + url;
                  }
                  // Buka di tab baru
                  window.open(url, '_blank');
                }}
              >
                Buka URL Kamera di Tab Baru
              </Button>
            )}
          </Box>
        </Grid>
        
        {testResult !== null && (
          <Grid item xs={12}>
            <Alert severity={testResult ? 'success' : 'error'}>
              {testResult 
                ? 'Koneksi kamera berhasil!' 
                : 'Koneksi kamera gagal. Periksa pengaturan dan coba lagi.'}
            </Alert>
          </Grid>
        )}
        
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}
      </Grid>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Catatan:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>PENTING UNTUK KAMERA DAHUA ANDA:</strong>
          <br />
          &nbsp;&nbsp;Karena video hanya dapat dilihat di halaman utama (http://192.168.1.108/):
          <br />
          &nbsp;&nbsp;1. Pilih "MJPEG Stream" sebagai Tipe Kamera
          <br />
          &nbsp;&nbsp;2. Masukkan hanya URL utama: <strong>http://192.168.1.108</strong> (tanpa path tambahan)
          <br />
          &nbsp;&nbsp;3. Isi username: <strong>admin</strong> dan password: <strong>@dminparkir</strong>
          <br />
          &nbsp;&nbsp;4. Klik "Simpan Konfigurasi" lalu "Tes Koneksi"
          <br />
          <br />
          • Aplikasi akan mencoba mengambil gambar dari halaman utama dengan salah satu dari metode berikut:
          <br />
          &nbsp;&nbsp;1. Mencoba beberapa endpoint snapshot umum secara otomatis
          <br />
          &nbsp;&nbsp;2. Mengekstrak gambar dari video yang ditampilkan di halaman utama
          <br />
          &nbsp;&nbsp;3. Menemukan gambar di dalam HTML dari halaman tersebut
          <br />
          <br />
          • <strong>Masalah CORS:</strong> Untuk berhasil mengakses video dari halaman utama, Anda HARUS menginstal 
            dan mengaktifkan ekstensi "CORS Unblock" atau "Moesif Origin & CORS Changer" di browser Anda.
          <br />
          <br />
          • <strong>Masalah lain:</strong> Jika masih mengalami kesulitan, coba buka URL http://192.168.1.108 di tab browser terpisah dan periksa HTML source dengan menekan tombol F12 untuk menemukan URL stream video yang tepat.
        </Typography>
      </Box>
    </Paper>
  );
};

export default CameraSettings; 