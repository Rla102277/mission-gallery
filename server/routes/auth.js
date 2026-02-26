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
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ user: null });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key');
    res.json({ user: decoded });
  } catch (error) {
    res.status(401).json({ user: null });
  }
});

export default router;
