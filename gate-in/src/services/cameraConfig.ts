interface IPCameraConfig {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  type: 'rtsp' | 'http' | 'mjpeg';
  enabled: boolean;
}

// Default configuration for a local webcam (non-IP)
export const DEFAULT_WEBCAM = {
  id: 'local',
  name: 'Local Webcam',
  url: '',
  username: '',
  password: '',
  type: 'http' as const,
  enabled: true
};

class CameraConfigService {
  private storageKey = 'parking-system-cameras';
  
  // Get all configured cameras
  getConfigs(): IPCameraConfig[] {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Failed to load camera configurations:', err);
    }
    return [];
  }
  
  // Add a new camera configuration
  addConfig(config: IPCameraConfig): boolean {
    try {
      const configs = this.getConfigs();
      
      // Validate uniqueness of ID
      if (configs.some(c => c.id === config.id)) {
        return false;
      }
      
      configs.push(config);
      localStorage.setItem(this.storageKey, JSON.stringify(configs));
      return true;
    } catch (err) {
      console.error('Failed to save camera configuration:', err);
      return false;
    }
  }
  
  // Update an existing camera configuration
  updateConfig(config: IPCameraConfig): boolean {
    try {
      let configs = this.getConfigs();
      const index = configs.findIndex(c => c.id === config.id);
      
      if (index === -1) {
        return false;
      }
      
      configs[index] = config;
      localStorage.setItem(this.storageKey, JSON.stringify(configs));
      return true;
    } catch (err) {
      console.error('Failed to update camera configuration:', err);
      return false;
    }
  }
  
  // Delete a camera configuration
  deleteConfig(id: string): boolean {
    try {
      let configs = this.getConfigs();
      const newConfigs = configs.filter(c => c.id !== id);
      
      if (newConfigs.length === configs.length) {
        return false; // No change
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(newConfigs));
      return true;
    } catch (err) {
      console.error('Failed to delete camera configuration:', err);
      return false;
    }
  }
  
  // Get a specific camera config by ID
  getConfig(id: string): IPCameraConfig | null {
    const configs = this.getConfigs();
    return configs.find(c => c.id === id) || null;
  }
  
  // Format a camera URL with authentication if needed
  formatCameraUrl(config: IPCameraConfig): string {
    if (!config.username && !config.password) {
      return config.url;
    }
    
    try {
      const url = new URL(config.url);
      
      // Add authentication to the URL
      url.username = config.username;
      url.password = config.password;
      
      return url.toString();
    } catch (err) {
      console.error('Invalid camera URL:', err);
      return config.url;
    }
  }
  
  // Test if a camera is accessible
  async testCamera(config: IPCameraConfig): Promise<boolean> {
    // For security reasons, browser may not allow testing IP cameras directly
    // This is a simplified example
    try {
      const url = this.formatCameraUrl(config);
      
      // For MJPEG type, we can test with an image request
      if (config.type === 'mjpeg' || config.type === 'http') {
        const response = await fetch(url, { 
          method: 'HEAD',
          mode: 'no-cors', // This is needed for cross-origin requests
          credentials: 'include'
        });
        return true; // If no error is thrown, assume it's accessible
      }
      
      // RTSP streams cannot be directly tested in browser
      if (config.type === 'rtsp') {
        // Return true for RTSP as we can't test it directly in browser
        // In a real application, this would require a backend service
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Failed to test camera:', err);
      return false;
    }
  }
}

export const cameraConfigService = new CameraConfigService();
export type { IPCameraConfig }; 