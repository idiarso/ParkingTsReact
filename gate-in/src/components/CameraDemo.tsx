import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem
} from '@mui/material';
import SimpleCameraCapture from './SimpleCameraCapture';
import { SaveAlt, Delete } from '@mui/icons-material';

const CameraDemo: React.FC = () => {
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<'1:1' | '4:3' | '16:9'>('4:3');
  
  // Manejar la captura de una imagen
  const handleCapture = (imageSrc: string) => {
    setCapturedImages(prev => [...prev, imageSrc]);
    console.log('Imagen capturada con éxito');
  };
  
  // Eliminar una imagen
  const handleDelete = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };
  
  // Descargar una imagen
  const handleDownload = (imageSrc: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `imagen-${Date.now()}-${index}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Demostración de Captura de Cámara
        </Typography>
        
        <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Configuración
          </Typography>
          
          <FormControl sx={{ minWidth: 200, mb: 2 }}>
            <InputLabel>Relación de Aspecto</InputLabel>
            <Select
              value={selectedAspectRatio}
              label="Relación de Aspecto"
              onChange={(e) => setSelectedAspectRatio(e.target.value as '1:1' | '4:3' | '16:9')}
            >
              <MenuItem value="1:1">Cuadrado (1:1)</MenuItem>
              <MenuItem value="4:3">Estándar (4:3)</MenuItem>
              <MenuItem value="16:9">Panorámico (16:9)</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Ajuste la configuración y tome fotos con la cámara. Las imágenes capturadas aparecerán en la galería inferior.
          </Typography>
        </Paper>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Captura de Imágenes
          </Typography>
          
          <SimpleCameraCapture 
            onCapture={handleCapture} 
            aspectRatio={selectedAspectRatio}
          />
        </Box>
        
        {capturedImages.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Imágenes Capturadas ({capturedImages.length})
            </Typography>
            
            <Grid container spacing={2}>
              {capturedImages.map((imageSrc, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      p: 1, 
                      position: 'relative',
                      '&:hover .image-actions': {
                        opacity: 1,
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: '100%', 
                        paddingTop: '75%', 
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: 1,
                      }}
                    >
                      <img 
                        src={imageSrc} 
                        alt={`Captura ${index + 1}`} 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      
                      <Box 
                        className="image-actions"
                        sx={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          left: 0, 
                          right: 0, 
                          p: 1,
                          bgcolor: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          justifyContent: 'space-around',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="primary"
                          startIcon={<SaveAlt />}
                          onClick={() => handleDownload(imageSrc, index)}
                        >
                          Guardar
                        </Button>
                        
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => handleDelete(index)}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </Box>
                    <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                      Imagen {index + 1}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default CameraDemo; 