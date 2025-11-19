import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

const defaultClientUrl = 'https://mission-gallery-app.web.app';

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    console.log('✅ Google auth callback - User authenticated:', req.user?.email);
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
      },
      process.env.SESSION_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    console.log('🎫 JWT token created for:', req.user.email);
    
    // Redirect with token in URL (will be stored in localStorage by frontend)
    const redirectUrl = `${process.env.CLIENT_URL || defaultClientUrl}?token=${token}`;
    res.redirect(redirectUrl);
  }
);

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.redirect(process.env.CLIENT_URL || defaultClientUrl);
  });
});

router.get('/user', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('🔍 /auth/user called - Auth header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No valid auth header');
    return res.status(401).json({ user: null });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key');
    console.log('✅ Token verified for:', decoded.email);
    res.json({ user: decoded });
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
    res.status(401).json({ user: null });
  }
});

export default router;
