import express from 'express';
import axios from 'axios';

const router = express.Router();

const allowedRedirectOrigins = [
  process.env.CLIENT_URL,
  'https://mission-gallery-app.web.app',
  'https://mission-gallery-app.firebaseapp.com',
  'http://localhost:5173',
].filter(Boolean);

const fallbackClientUrl = (process.env.CLIENT_URL || 'https://mission-gallery-app.web.app').replace(/\/$/, '');

const getRedirectUri = (requestedRedirectUri) => {
  if (typeof requestedRedirectUri === 'string' && requestedRedirectUri.trim()) {
    try {
      const parsed = new URL(requestedRedirectUri.trim());
      const isAllowedOrigin = allowedRedirectOrigins.includes(parsed.origin);
      const isAllowedPath = parsed.pathname === '/test/lightroom' || parsed.pathname === '/admin' || parsed.pathname === '/admin/';
      if (isAllowedOrigin && isAllowedPath) {
        return parsed.toString();
      }
    } catch {
      // fall through to default
    }
  }

  return `${fallbackClientUrl}/test/lightroom`.replace('http:', 'https:');
};

// Public Adobe OAuth config (safe fields only)
router.get('/config', (req, res) => {
  const clientId = process.env.ADOBE_CLIENT_ID || process.env.VITE_ADOBE_CLIENT_ID || '';
  res.json({
    clientId,
    configured: Boolean(clientId && process.env.ADOBE_CLIENT_SECRET),
  });
});

// Exchange authorization code for access token
router.post('/token', async (req, res) => {
  const { code, redirectUri: requestedRedirectUri } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    const clientId = process.env.ADOBE_CLIENT_ID || process.env.VITE_ADOBE_CLIENT_ID;
    const clientSecret = process.env.ADOBE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Adobe client credentials are not configured' });
    }

    const redirectUri = getRedirectUri(requestedRedirectUri);
    
    console.log('Token exchange params:', {
      clientId: clientId?.substring(0, 10) + '...',
      clientSecret: clientSecret ? clientSecret.substring(0, 5) + '...' : 'MISSING',
      redirectUri,
      codeLength: code.length
    });
    
    const response = await axios.post('https://ims-na1.adobelogin.com/ims/token/v3', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    const providerError = error.response?.data;
    const providerMessage = providerError?.error_description || providerError?.error;
    console.error('Adobe token exchange error:', providerError || error.message);
    res.status(error.response?.status || 500).json({ 
      error: providerMessage || 'Failed to exchange code for token',
      details: providerError,
    });
  }
});

// Refresh an access token using a refresh token
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const clientId = process.env.ADOBE_CLIENT_ID || process.env.VITE_ADOBE_CLIENT_ID;
    const clientSecret = process.env.ADOBE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Adobe client credentials are not configured' });
    }

    const response = await axios.post(
      'https://ims-na1.adobelogin.com/ims/token/v3',
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Adobe refresh token error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to refresh Adobe token',
      details: error.response?.data,
    });
  }
});

// Test if token is valid and has correct scopes
router.get('/test-token', async (req, res) => {
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    // Try to get user info to validate token
    const response = await axios.get('https://ims-na1.adobelogin.com/ims/userinfo/v2', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    res.json({ 
      valid: true,
      user: response.data,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Token validation error:', error.response?.data || error.message);
    res.status(401).json({ 
      valid: false,
      error: 'Invalid or expired token',
      details: error.response?.data
    });
  }
});

// Proxy Lightroom image renditions (requires authentication)
router.get('/image-proxy', async (req, res) => {
  const { url, token } = req.query;
  
  if (!url || !token) {
    return res.status(400).json({ error: 'URL and token required' });
  }

  try {
    console.log('🖼️  Proxying Lightroom image:', url);
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': process.env.ADOBE_CLIENT_ID || process.env.VITE_ADOBE_CLIENT_ID
      },
      responseType: 'arraybuffer'
    });

    // Forward the image with correct content type
    res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(response.data);
  } catch (error) {
    console.error('Image proxy error:', error.response?.status, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch image',
      details: error.response?.data
    });
  }
});

export default router;
