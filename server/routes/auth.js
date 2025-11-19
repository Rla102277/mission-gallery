import express from 'express';
import passport from 'passport';

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

const defaultClientUrl = 'https://mission-gallery-app.web.app';

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    console.log('✅ Google auth callback - User authenticated:', req.user?.email);
    console.log('📝 Session ID:', req.sessionID);
    console.log('🔐 Session data:', req.session);
    res.redirect(process.env.CLIENT_URL || defaultClientUrl);
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
  console.log('🔍 /auth/user called - Session ID:', req.sessionID);
  console.log('🔍 Authenticated:', req.isAuthenticated());
  console.log('🔍 User:', req.user?.email);
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ user: null });
  }
});

export default router;
