const { createProxyMiddleware } = require('http-proxy-middleware');
const fetch = require('node-fetch');
const { AbortController } = require('abort-controller');

module.exports = function(app) {
  // Proxy untuk API server
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'http://localhost:5000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/'
      },
    })
  );
  
  // Proxy khusus untuk kamera - menghindari masalah CORS
  app.use('/api/camera/proxy', async (req, res) => {
    // Mengizinkan CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Set default timeout 30 detik
    const TIMEOUT = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    
    try {
      const url = req.query.url;
      const auth = req.query.auth;
      
      if (!url) {
        return res.status(400).json({ error: 'Missing URL parameter' });
      }
      
      console.log(`[Camera Proxy] Forwarding request to: ${url}`);
      
      const headers = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      // Tambahkan header auth jika disediakan
      if (auth) {
        headers['Authorization'] = `Basic ${auth}`;
      }
      
      // Coba beberapa metode berbeda jika gagal
      let response;
      
      try {
        // Metode 1: Basic fetch dengan credentials omit
        response = await fetch(url, {
          method: 'GET',
          headers,
          credentials: 'omit',
          signal: controller.signal
        });
      } catch (error) {
        console.log('[Camera Proxy] Method 1 failed, trying alternative URL format');
        
        // Metode 2: Coba format URL dengan auth embedded
        if (auth) {
          try {
            const urlObj = new URL(url);
            const authString = Buffer.from(auth, 'base64').toString();
            const [username, password] = authString.split(':');
            
            urlObj.username = encodeURIComponent(username);
            urlObj.password = encodeURIComponent(password);
            
            const urlWithAuth = urlObj.toString();
            console.log(`[Camera Proxy] Trying with auth in URL: ${urlWithAuth.replace(/:[^:@]*@/, ':***@')}`);
            
            response = await fetch(urlWithAuth, {
              method: 'GET',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              },
              credentials: 'omit',
              signal: controller.signal
            });
          } catch (error2) {
            throw new Error(`Both connection methods failed: ${error.message} and ${error2.message}`);
          }
        } else {
          throw error;
        }
      }
      
      // Periksa response status
      if (!response.ok) {
        console.error(`[Camera Proxy] Error: ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ 
          error: `Camera returned error: ${response.status} ${response.statusText}` 
        });
      }
      
      // Ambil content-type dari response
      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
      
      // Pipe response langsung ke client
      const buffer = await response.buffer();
      clearTimeout(timeoutId);
      return res.status(200).send(buffer);
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[Camera Proxy] Error:', error);
      
      if (error.name === 'AbortError') {
        return res.status(504).json({ error: 'Request timeout after 30 seconds' });
      }
      
      return res.status(500).json({ error: error.message });
    }
  });

  // Proxy untuk Socket.IO dengan timeout yang lebih lama
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',
      changeOrigin: true,
      ws: true,
      timeout: 60000,
      onError: (err, req, res) => {
        console.error('[Socket.IO Proxy] Error:', err);
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Socket.IO proxy error', message: err.message }));
        }
      }
    })
  );
}; 